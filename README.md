#GET /search


##Response

<code>keywords : ["keyword", ...]</code>


#POST /search 

##Params

<code>{ search_keyword: "keyword", keywords: ["keyword", "keyword", ...] }</code>


##Response

<pre>{

	keywords: [
		{
			id: 1,
			text: "keyword",
			exploitation: 0.5,
			exploration: 0.3
		},
		...
	],
	people: [
	{
		name: "Kalle Ilves",
		keywords: [1, 2, 3, ...]
	},
	...
	]

}</pre>

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

<pre>{
	keywords: [
		{
			id: 1,
			text: "keyword",
			exploitation: 0.5,
			exploration: 0.3
		},
		...
	],
	people: [
	{
		name: "Kalle Ilves",
		keywords: [1, 2, 3, ...]
	},
	...
	]
}</pre>
