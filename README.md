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
	persons: [
		{
			name: "Kalle Ilves",
			keywords: [1, 2, 3, ...],
			articles: [
				{
					title: "Some title",
					abstract: "Some abstract"
				},
				...
			]
		},
		...
	]

}
</pre>

#POST/next

##Params

<pre>
{
	keywords: [
		{
			id: 1
			text: "keyword"
			weight: 0.2
		},
		...

	],
	
	// These are keywords (id of each removed keyword) removed by the user
	removed: [1, 2, 3]
}
</pre>

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
	persons: [
		{
			name: "Kalle Ilves",
			keywords: [1, 2, 3, ...],
			articles: [
				{
					title: "Some title",
					abstract: "Some abstract"
				},
				...
			]
		},
		...
	]
}</pre>

#GET chart_data

{
	charts : [],
	articles: [
		{
			title: "title",
			id: 1
		},
		...
	]
}

#GET article_matrix

##Params

<pre>
{
	ids: [1, 2, 3, ...]
}
</pre>

##Response

# When more than 10 articles are selected 
<pre>
{
	matrix: 
	[
		[
			1,
			2,
			3
		]
	]
}
</pre>
# When less than 10 articlesare selected
<pre>
{
	matrix: 
	[
		[
			{
				value:1, 
				title: "",
				abstract: ""
			} ...
		]
	]
	topic_model_relation:
	{
		articleID:topicID,
		...
	}
	topic_data:
	{
		topicID:
		{
			keyword1: passibility1,
			...
		},
		...
	}
}
</pre>
# Tasks for gao

- topic models data
- clean data for all authers
- formalize the preprocessing step

# Tasks

- <strike> merge deselete and select icon </strike> 
- <strike> chart bug when number of astracts are big than 20</strike>

- Chart data (persons and keyword counts + persons and keyword weights)
- <strike>A small bug lies in acquiring abstracts. The expand button is wrong</strike> *done*
