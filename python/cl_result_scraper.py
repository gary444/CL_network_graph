import time
from selenium import webdriver
from selenium.common import exceptions
from result import Result
import re
import json




# selenium set up
# driver = webdriver.Chrome('../selenium/chromedriver')
driver = webdriver.Firefox(executable_path='/Users/garyrendle/Documents/5_PROGRAMMING/Viz/CL_network_graph/selenium/geckodriver')

# data locations
base_url = 'https://www.flashscore.com/football/europe/champions-league-'
urls = []
urls.append(('2016', base_url + '2016-2017/results/'))
urls.append(('2017', base_url + '2017-2018/results/'))
urls.append(('2018', base_url + '2018-2019/results/'))

sel_accept_cookies_btn = "//button[contains(.,'Accept Cookies')]"
sel_show_more_results_btn = "//a[@class='event__more event__more--static']"
sel_results_table_entries="//div[@class='sportName soccer']/div"

results = []


def get_results_on_page(page_url, year):

	page_results = []

	# navigate to site
	driver.get(page_url)
	time.sleep(5)

	try :
		# accept cookies
		driver.find_element_by_xpath(sel_accept_cookies_btn).click()
		time.sleep(5)
	except exceptions.NoSuchElementException:
		print('no cookies button found this time')

	# show all matches
	driver.find_element_by_xpath(sel_show_more_results_btn).click()
	time.sleep(10)

	# get result entries
	results_table_entries = driver.find_elements_by_xpath(sel_results_table_entries)

	# iterate result objects and create results
	current_round = 'none'
	found_finals = 0;

	# bracket removal regex
	regex = re.compile("\((.*?)\)")

	for r in results_table_entries[1:len(results_table_entries)]:
		r_class = r.get_attribute("class")
		
		if 'event__round' in r_class:
			current_round = r.text.strip()

			# second 'Final' round is the qualifying rounds - quit
			if 'Final' in current_round:
				found_finals+=1
			if found_finals > 1:
				print('Second final encountered - quitting')
				break
			
			print(current_round)

		# process the individual match elements
		elif 'event__match' in r_class:

			date = r.find_element_by_xpath(".//*[contains(@class,'event__time')]").text
			ht = r.find_element_by_xpath(".//*[contains(@class,'event__participant--home')]").text
			at = r.find_element_by_xpath(".//*[contains(@class,'event__participant--away')]").text
			
			score = r.find_element_by_xpath(".//*[contains(@class,'event__scores')]").text
			# remove bracketed scores
			score = regex.sub('',score)
			scores = score.split('-')

			hts = int(scores[0].strip().replace('\n',''))
			ats = int(scores[1].strip().replace('\n',''))

			page_results.append(Result(ht, at, hts, ats, current_round, date, year))

	return page_results

# Run the above function for each page in the URL list
try:
	for u in urls:
		# results.append( get_results_on_page(u) )
		results = results +  get_results_on_page(u[1], u[0]) ;
finally:
	print('Closing driver')
	driver.quit()


with open('../data/scraped_results.txt', 'w') as filehandle:
	json.dump([ob.__dict__ for ob in results], filehandle)

for r in results:
	print(str(r))

print(len(results))



# to open
# with open('listfile.txt', 'r') as filehandle:
#     basicList = json.load(filehandle)
