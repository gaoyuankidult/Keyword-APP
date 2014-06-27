-----------
GET /search
-----------

RESPONSE:

keywords : ["keyword", ...]


-------------
POST /search 
-------------

PARAMS:

{ search_keyword: "keyword", keywords: ["keyword", "keyword", ...] }


RESPONSE:

keywords: [
	{
		text: "keyword",
		exploitation: 0.5,
		exploration: 0.3
	},
	...
]

----------
POST /next 
----------

PARAMS:

keywords: [
	{
		text: "keyword"
		weight: 0.2
	},
	...
]

RESPONSE:

keywords: [
	{
		text: "keyword",
		exploitation: 0.5,
		exploration: 0.3
	},
	...
]
