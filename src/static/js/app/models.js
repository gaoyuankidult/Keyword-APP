function Keyword(id, text, exploitation, exploration){
	this.id = id || 0;
	this.text = text;
	this.exploitation = exploitation || 0;
	this.exploration = exploration || 0;
	this.weight = Math.round(( this.exploitation / ( this.exploitation + this.exploration ) * 100 )) || 0;
	this.selected = false;
	this.removed = false;
}

function Person(id, name, keywords, articles, profile_picture, profile_info){
	this.id = id || 0;
	this.name = name;
	this.profile_picture = profile_picture;
	this.keywords = keywords || [];
	this.articles = articles || [];
	this.selected = false;
	this.profile_info = profile_info || {};
}

function Article(title, abstract, id, url, author_profile_picture){
	this.title = title;
	this.abstract = abstract;
	this.id = id;
	this.url = url;
	this.author_profile_picture = author_profile_picture;

	this.highlighted_title = title;
	this.highlighted_abstract = abstract;
}
