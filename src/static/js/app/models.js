function Keyword(id, text, exploitation, exploration){
	this.id = id || 0;
	this.text = text;
	this.exploitation = exploitation || 0;
	this.exploration = exploration || 0;
	this.weight = Math.round(( this.exploitation / ( this.exploitation + this.exploration ) * 100 )) || 0;
	this.selected = false;
	this.removed = false;
}

function Person(id, name, keywords, articles){
	this.id = id || 0;
	this.name = name;
	this.keywords = keywords || [];
	this.articles = articles || [];
	this.selected = false;
}

function Article(title, abstract, id){
	this.title = title;
	this.abstract = abstract;
	this.id = id;

	this.highlighted_title = title;
	this.highlighted_abstract = abstract;
}
