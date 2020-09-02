class Result: 
	def __init__(self, ht, at, hts, ats,round, date,year, winner = "h"):
		self.ht = ht
		self.at = at
		self.hts = hts
		self.ats = ats
		self.rnd = round
		self.date = date
		self.year = year
		self.winner = winner

	def __str__(self):
		return (self.year + " | " + self.date + " (" + \
			  self.rnd + ") : " +
			  self.ht + " " +
			  str(self.hts) + " - " +
			  str(self.ats) + " " +
			  self.at + "(" + self.winner + ")")