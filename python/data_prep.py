import csv
import os
import sys
import math as Math
from result import Result
import json
import numpy as np
import matplotlib.pyplot as plt
from collections import Counter


# Takes the champs.csv file and creates a list of Result objects for CL results up until the 2015-16 tourno

# class Result: 
# 	def __init__(self, homeTeam, awayTeam, homeTeamScore, awayTeamScore):
# 		self.ht = homeTeam;
# 		self.at = awayTeam;
# 		self.hts = homeTeamScore;
# 		self.ats = awayTeamScore;

results = []


# champs.csv file

with open('../data/champs.csv', newline='') as csvf:
    data = list(csv.reader(csvf))
    data = data[1:len(data)]

    for i in data:
    	year = int(i[1])
    	if year < 1992:
    		continue;

    	round = i[2]
    	if 'prelim' not in round.lower() and 'Q-' not in round:
    		scores = i[6].split('-')
    		results.append(Result(i[4],i[5],scores[0],scores[1], round, i[0], i[1]) )


with open('../data/scraped_results.txt', 'r') as filehandle:
	json_results = json.load(filehandle)

	for r in json_results:
		results.append(Result(r['ht'],r['at'],r['hts'],r['ats'],r['rnd'],r['date'],r['year']))
	

# check results per year
# year_histogram = {}
# for yr in range(1992,2020):
# 	year_histogram[str(yr)] = 0

# for r in results:
# 	print(str(r))
# 	year_histogram[r.year] += 1

# print(year_histogram)

print("num results " + str(len(results)))


team_lookup = {}
team_lookup['AEK Athens FC']='AEK Athens'
team_lookup['AFC Ajax']='Ajax'
team_lookup['APOEL Nikosia']='APOEL'
team_lookup['AS Monaco']='Monaco'
team_lookup['Atletico Madrid']='Atl. Madrid'
team_lookup['Borussia Monchengladbach']='B. Monchengladbach'
team_lookup['CSKA Moskva']='CSKA Moscow'
team_lookup['Club Brugge KV']='Club Brugge'
team_lookup['D. Zagreb']='Dinamo Zagreb'
team_lookup['Borussia Dortmund']='Dortmund'
team_lookup['Dyn. Kyiv']='Dinamo Kiev'
team_lookup['Inter']='Internazionale'
team_lookup['Kobenhavn']='FC Copenhagen'
team_lookup['Legia']='Legia Warsaw'
team_lookup['Lokomotiv Moskva']='Lokomotiv Moscow'
team_lookup['PFC Ludogorets Razgrad']='Ludogorets'
team_lookup['Olympique Lyon']='Lyon'
team_lookup['Manchester United']='Manchester Utd'
team_lookup['NK Maribor']='Maribor'
team_lookup['Olympiacos Piraeus']='Olympiacos'
team_lookup['PSV']='PSV Eindhoven'
team_lookup['Paris Saint-Germain']='Paris SG'
team_lookup['RSC Anderlecht']='Anderlecht'
team_lookup['SL Benfica']='Benfica'
team_lookup['SSC Napoli']='Napoli'
team_lookup['Schalke']='Schalke 04'
team_lookup['Spartak Moskva']='Spartak Moscow'
team_lookup['Sporting']='Sporting CP'
team_lookup['Tottenham Hotspur']='Tottenham'
team_lookup['Valencia CF']='Valencia'
team_lookup['Plzen']='Viktoria Plzen'

def check_team_name(name):
	if name in team_lookup:
		return team_lookup[name];
	return name

for r in results:
	r.ht = check_team_name(r.ht)
	r.at = check_team_name(r.at)


# find list of unique
all_teams = []
for r in results:
	all_teams.append(r.ht)
	all_teams.append(r.at)

teams = sorted(list(set(all_teams)))
NUM_TEAMS = len(teams)

print('num teams: ' + str(NUM_TEAMS))

# count appearances of teams and order
match_counts = np.zeros(NUM_TEAMS)
c = Counter(all_teams)
for i in range(NUM_TEAMS):
	match_counts[i] = c[ teams[i] ]

descending_order_idxs = np.flip(np.argsort(match_counts))
teams = np.array(teams)[descending_order_idxs]


# build link weight matrix

link_weights = np.zeros(( NUM_TEAMS,NUM_TEAMS))


wins = np.zeros(NUM_TEAMS)
losses = np.zeros(NUM_TEAMS)
draws = np.zeros(NUM_TEAMS)

for r in results:
	# ht_id = teams.index(r.ht)
	# at_id = teams.index(r.at)

	ht_id = np.where(teams == r.ht)
	at_id = np.where(teams == r.at)

	# # only do one link weight increment per match
	if (ht_id > at_id):
		link_weights[ht_id, at_id] += 1
	else:
		link_weights[at_id, ht_id] += 1

	# record result outcomes
	if (r.hts > r.ats):
		wins[ht_id] += 1
		losses[at_id] += 1
	elif (r.hts == r.ats):
		draws[ht_id] += 1
		draws[at_id] += 1
	else:
		wins[at_id] += 1
		losses[ht_id] += 1

matches = wins + losses + draws

# sort in order of matches played
# descending_order_idxs = np.flip(np.argsort(matches))

# for x in range(len(teams)):
# 	link_weights[x] = link_weights[x][descending_order_idxs]

# matches = matches[descending_order_idxs]
# wins = wins[descending_order_idxs]
# losses = losses[descending_order_idxs]
# draws = draws[descending_order_idxs]
# teams = np.array(teams)[descending_order_idxs]

# # need to take care of matrix when sorting. build an index from original team id to new order id
# # then apply this when building nodes and links json objects

# # calculate win percentage
win_pc = wins / matches


# plot as heat map

# plt.imshow(link_weights, cmap='hot')
# plt.show()


# convert to links / nodes object

json_obj = {}

json_obj['nodes'] = []
json_obj['links'] = []

for team_id in range(len(teams)):
	team = {}
	team['id'] = team_id
	team['name'] = teams[team_id]
	team['matches'] = matches[team_id]
	team['win_pc'] = win_pc[team_id]
	json_obj['nodes'].append(team)


# threshold the link matrix
LINK_WEIGHT_THRES = 0
link_idxs = np.where(link_weights > LINK_WEIGHT_THRES)
print("using " + str(np.shape(link_idxs)[1]) + " links")
# create links from found indices
for l in range(np.shape(link_idxs)[1]):
	ht_id = link_idxs[0][l]
	at_id = link_idxs[1][l]
	link = {}
	link['source'] = str(ht_id)
	link['target'] = str(at_id)
	link['weight'] = str(link_weights[ht_id][at_id])
	json_obj['links'].append(link)


with open('../js/template/data/cl_nodes_links_ordered.json', 'w') as filehandle:
	# json.dump([ob.__dict__ for ob in json_obj], filehandle)
	json.dump(json_obj, filehandle)

