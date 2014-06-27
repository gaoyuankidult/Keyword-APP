#GET /search


##Response

<code>keywords : ["keyword", ...]</code>


#POST /search 

##Params

<code>{ search_keyword: "keyword", keywords: ["keyword", "keyword", ...] }</code>


##Response

<code>keywords: [
	{
		text: "keyword",
		exploitation: 0.5,
		exploration: 0.3
	},
	...
]</code>

#POST /next 

##Params

<code>keywords: [
	{
		text: "keyword"
		weight: 0.2
	},
	...
]</code>

##Response

<code>keywords: [
	{
		text: "keyword",
		exploitation: 0.5,
		exploration: 0.3
	},
	...
]</code>
