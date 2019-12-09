"""
Script to parse drafty data
"""
import csv
import json
import pandas as pd
import numpy as np

from pprint import pprint

def prepro_name(uni_name):
    if " - USA" in uni_name:
        uni_name = uni_name.replace(" - USA", "")
    if " - " in uni_name:
        uni_name = uni_name.replace(" - ", "-")

    if "Georgia Institute of Technology" in uni_name:
        uni_name = uni_name.replace("Georgia Institute of Technology", "Georgia Institute of Technology-Main Campus")

    if "Arkansas State University" in uni_name:
        uni_name = uni_name.replace("Arkansas State University", "Arkansas State University-Main Campus")

    if "Bowling Green State University" in uni_name:
        uni_name = uni_name.replace("Bowling Green State University", "Bowling Green State University-Main Campus")

    if "Indiana University of Pennsylvania" in uni_name:
        uni_name = uni_name.replace("Indiana University of Pennsylvania", "Indiana University of Pennsylvania-Main Campus")

    if "New Mexico State University" in uni_name:
        uni_name = uni_name.replace("New Mexico State University", "New Mexico State University-Main Campus")
    
    if "North Dakota State University" in uni_name:
        uni_name = uni_name.replace("North Dakota State University", "North Dakota State University-Main Campus")

    if "Ohio State University" in uni_name:
        uni_name = uni_name.replace("Ohio State University", "Ohio State University-Main Campus")

    if "Ohio University" in uni_name:
        uni_name = uni_name.replace("Ohio University", "Ohio University-Main Campus")

    if "Oklahoma State University" in uni_name:
        uni_name = uni_name.replace("Oklahoma State University", "Oklahoma State University-Main Campus")

    if "Pennsylvania State University" in uni_name:
        uni_name = uni_name.replace("Pennsylvania State University", "Pennsylvania State University-Main Campus")

    if "Purdue University" in uni_name:
        uni_name = uni_name.replace("Purdue University", "Purdue University-Main Campus")

    if "University of Cincinnati" in uni_name:
        uni_name = uni_name.replace("University of Cincinnati", "University of Cincinnati-Main Campus")

    if "University of New Hampshire" in uni_name:
        uni_name = uni_name.replace("University of New Hampshire", "University of New Hampshire-Main Campus")

    if "University of New Mexico" in uni_name:
        uni_name = uni_name.replace("University of New Mexico", "University of New Mexico-Main Campus")
    
    if "University of South Florida" in uni_name:
        uni_name = uni_name.replace("University of South Florida", "University of South Florida-Main Campus")

    if "University of Virginia" in uni_name:
        uni_name = uni_name.replace("University of Virginia", "University of Virginia-Main Campus")

    if "Wright State University" in uni_name:
        uni_name = uni_name.replace("Wright State University", "Wright State University-Main Campus")

    if "Wright State University" in uni_name:
        uni_name = uni_name.replace("Wright State University", "Wright State University-Main Campus")

    if "University of Akron" in uni_name:
        uni_name = uni_name.replace("University of Akron", "University of Akron Main Campus")

    return uni_name

if __name__ == "__main__":
    # Load the csv data
    data_df = pd.read_csv('drafty_data_csv.csv')

    # Get the list of unique doctoral universities
    unique_doc_uni = data_df.Doctorate.unique().tolist()
    
    # Get the list of unique appointment universities
    unique_app_uni = data_df.University.unique().tolist()

    # Node-link data structure
    uni_nod_lnk, nodes = [], []

    for i in range(1, len(unique_doc_uni)):
        curr_doc_uni = unique_doc_uni[i]
        # print(curr_doc_uni)
        # curr_doc_uni = prepro_name(curr_doc_uni)
        # print(curr_doc_uni)
        # Find universities appointed to
        curr_app_uni_df = data_df[data_df["Doctorate"] == curr_doc_uni]
        curr_app_uni = curr_app_uni_df.University.value_counts().index.tolist()
        curr_app_uni_wt = curr_app_uni_df.University.value_counts().tolist()
        for j in curr_app_uni:
            uni_nod_lnk.append({
                "source": prepro_name(curr_doc_uni),
                "target": prepro_name(j),
                "weight": curr_app_uni_wt[curr_app_uni.index(j)]
            })
            nodes.append(prepro_name(curr_doc_uni))
            nodes.append(prepro_name(j))

    
    # Save 2 files
    # 1-Containing the list of nodes
    # 2-Containing the links
    with open('nodes.json', 'w') as f:
        json.dump(list(set(nodes)), f)
    
    with open('links.json', 'w') as f:
        json.dump(uni_nod_lnk, f)




