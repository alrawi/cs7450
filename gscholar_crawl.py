from __future__ import print_function
import time
import sys
import scholarly
import os
import json
import copy
import traceback

cwd = os.getcwd()
flog=open("crawl_error.log","a")

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def pub_auth_crawl(auth):
    """
    Crawl the publicatios based on author name
    """
    if auth=="":
        return 0
    pub_dict={}
    year_order=['2019','2018','2017','2016','2015']
    try:
        eprint("Crawling {}".format(auth))
        stime=time.time()
        dirname=auth.lower().replace(' ','_')
        path="{0}/{1}".format(cwd,dirname)
        os.mkdir(path)
        os.chdir(path)
        qry = scholarly.search_author(auth)

        # check author from US
        author=None
        author_list=list(qry) #=next(qry)
        #.__dict__["email"].endswith(".edu")
        for athr in author_list:
            if athr.__dict__["email"].endswith(".edu"):
                author=athr
                break
        if author==None:
            raise Exception("AuthorNotFound","US author not found")

        # if author from US fill
        author.fill()
        szl_auth_copy=copy.deepcopy(author)
        delattr(szl_auth_copy, 'coauthors')
        delattr(szl_auth_copy, 'publications')
        # write author info
        with open("info.json","w") as finfo:
            finfo.write(json.dumps(szl_auth_copy.__dict__))
        # write author's pub
        with open("pub.json", "w") as fpub:
            for pub in author.publications:
                fpub.write("{}\n".format(json.dumps(pub.__dict__)))

        # get pub details for author pub
        for pub in author.publications:
            if "year" not in pub.bib.keys():
                continue
            year=str(pub.bib["year"])
            if year not in pub_dict.keys():
                pub_dict[year]=[]
            pub_dict[year].append(pub)
        i=0 # flag for pubs to consider
        top_pubs=[]
        while True: # consider the top 10 pubs only by year
            eprint("crawling pubs...")
            for key in year_order:
                eprint("Crawling pubs for year {}".format(key))
                eprint("Added {} pubs so far.".format(i))
                if key not in pub_dict.keys():
                    eprint("key {} not found in {} keys".format(key,pub_dict.keys()))
                    #break
                    continue
                j=0 #count pub per year
                for pub in pub_dict[key]:
                    if j>3: # pick 4 pubs per year
                        break
                    eprint("processing {}".format(pub.bib["title"]))
                    pub.fill()
                    if "abstract" in pub.bib.keys():
                        pub.bib["abstract"]=pub.bib["abstract"].text
                    top_pubs.append(pub.__dict__)
                    i+=1
                    j+=1
            break
        with open("top_pubs.json", "w") as fpub:
            for pub in top_pubs:
                fpub.write("{0}\n".format(json.dumps(pub)))
        with open("coauthors.json","w") as fcoauth:
            for coauth in author.coauthors: #coauthors
                fcoauth.write("{0}\n".format(json.dumps(coauth.__dict__)))
        print("Crawl Done in {} seconds".format(time.time()-stime))
    except:
        traceback.print_exc()
        print("Unexpected error:", sys.exc_info()[0])
        flog.write("Failed to for author {}. Record not found.\n".format(auth))

    #sys.exit(0)


def pub_crawl(pub):
    if pub=="":
        return 0
    try:
        scholarly.search_pubs_query
        sq = scholarly.search_pubs_query(pub.strip())
        publication=next(sq).fill()
        with open("master_pub.json", "a") as fpub:
            fpub.write(json.dumps(publication.__dict__))
    except:
        traceback.print_exc()
        print("Unexpected error:", sys.exc_info()[0])

def gid_crawl(query_author=''):
    if query_author=='':
        return 0
    try:
        gid=query_author.split(',')[1]
        print("Fetching Author with GID: {0}".format(gid))
        name = scholarly.search_author_gsid(gid)
        print("Found: {}".format(name))
        crawl(name)
    except:
        traceback.print_exc()
        print("Unexpected error:", sys.exc_info()[0])
        #flog.write("Failed to for author {}. Record not found.\n".format(query_author))


def crawl(query_author=''):
    if query_author=='':
        return 0
    try:
        author=query_author.strip().split(',')[0]
        print("Author Name to look for")
        dirname=author.lower().replace(' ','_')
        path="{0}/{1}".format(cwd,dirname)
        os.mkdir(path)
        os.chdir(path)
        search_query = scholarly.search_author(query_author)
        author_obj=next(search_query).fill()
        szl_auth_copy=copy.deepcopy(author_obj)
        delattr(szl_auth_copy, 'coauthors')
        delattr(szl_auth_copy, 'publications')

        # write author's info to json
        with open("info.json","w") as finfo:
            finfo.write(json.dumps(szl_auth_copy.__dict__))

        with open("pub.json", "w") as fpub:
            for pub in author_obj.publications:
                fpub.write("{}\n".format(json.dumps(pub.__dict__)))

        os.chdir(cwd)
    except StopIteration:
        flog.write("Failed to for author {}. Record not found.\n".format(query_author))
    finally:
        os.chdir(cwd)

def list_crawl(author_file='', port=None):
    if author_file=='' or port==None:
        return 0

    if int(port)>0:
        proxies = { 'http' : 'socks5://127.0.0.1:{0}'.format(port), 
                    'https': 'socks5://127.0.0.1:{0}'.format(port)}
        scholarly.scholarly._SESSION.proxies=proxies

    #split author and univ before crawl
    with open(author_file, "r") as fauth:
        for line in fauth.readlines():
            query_auth=line.strip()
            #crawl(query_auth)
            #gid_crawl(query_auth)
            #pub_crawl(query_auth)
            pub_auth_crawl(query_auth)

def usage():
    print("""
        USAGE: $ python3 {0} <author_file> <socks5_port>
        Parameters:
            author_name: A CSV file with "author_name,affiliation" to 
                         crawl from Google Scholar.
            socks5_port: Port number to proxy the request through
        Output: Dir with author name that contains author info in file
                info.json and list of pub under file "pub.json."
    """.format(sys.argv[0]))
    return 0

if __name__=="__main__":
    if len(sys.argv)<3:
        usage()
        sys.exit(1)
    else:
        #crawl('omar alrawi')
        list_crawl(sys.argv[1],sys.argv[2])
