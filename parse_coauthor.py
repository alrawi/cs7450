import sys
import json

def eprint(*args, **kwargs):
    pass
    #print(*args, file=sys.stderr, **kwargs)

def parse_coauths(coauthd):
    if coauthd=="":
        return 0
    sauth=None
    with open("{}/info.json".format(coauthd), 'r') as fauth:
        sauth=json.loads(fauth.read())
    print(sauth.keys())
    print(sauth)
    nodes=[{"id":sauth["id"],
            "name":sauth["name"],
            "pic":sauth["url_picture"],
            "aff":sauth["affiliation"]
            }
        ]
    links=[]
    with open("{}/coauthors.json".format(coauthd),"r") as fcoauth:
        for auth in fcoauth.readlines():
            print(auth)
            oauth=json.loads(auth)
            nodes.append({"id":oauth["id"], 
                "name":oauth["name"],
                "aff":sauth["affiliation"],
                "pic":""})
            links.append({"source":sauth["id"], "target":oauth["id"]})
    print(json.dumps({"nodes":nodes,"links":links}))

if __name__=="__main__":
    if len(sys.argv)<2:
        print("""
        python3 {} <path_to_auth_dir>
        auth_dir: Directory that contains the info.json and coauthors.json files
                """.format(sys.argv[0]))
        sys.exit(1)
    else:
        parse_coauths(sys.argv[1])

"""
"_filled",
  "affiliation",
  "citedby",
  "citedby5y",
  "cites_per_year",
  "email",
  "hindex",
  "hindex5y",
  "i10index",
  "i10index5y",
  "id",
  "interests",
  "name",
  "url_picture"
"""
