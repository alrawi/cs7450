import os
import json
from tqdm import tqdm
from collections import defaultdict
import numpy as np
import pandas as pd

def main():
    fac_df = pd.read_csv(os.path.join('data', 'us_auths_univ_uniq.csv'))
    uni2faclist = defaultdict(list)
    for index, row in fac_df.iterrows():
        faculty, uni = row[0], row[1]
        uni2faclist[uni].append(faculty)
    out_dict = defaultdict(dict)
    out_dict = defaultdict(dict)
    missed, total = 0, 0
    for uni, fac_list in tqdm(uni2faclist.items()):
        out_dict[uni] = defaultdict(dict)
        out_dict[uni]["data"] = []
        for faculty in fac_list:
            fac_name = "_".join(faculty.lower().split(' '))
            fpath = os.path.join('crawl', fac_name, 'info.json')
            if not os.path.exists(fpath):
                print('Missed {}'.format(fpath))
                missed += 1
                continue
            
            with open(fpath, 'r') as f:
                fac_data = json.load(f)
                # if fac_data['affiliation'].lower() != uni:
                #     print('Collison, skip {}'.format(fpath))
                #     continue
                out_dict[uni]["data"].append(fac_data)
                total += 1

        with open(os.path.join('data', 'preprocessed', 'faculty_{}.json'.format('_'.join(uni.lower().split(' ')))), 'w') as f:
            json.dump(out_dict[uni], f, indent=4)
    print('Missed {} / {} faculty'.format(missed, total))
if __name__ == "__main__":
    main()