function Keyword(id, text, exploitation, exploration){
	this.id = id || 0;
	this.text = text;
	this.exploitation = exploitation || 0;
	this.exploration = exploration || 0;
	this.weight = Math.round(( this.exploitation / ( this.exploitation + this.exploration ) * 100 )) || 0;
	this.selected = false;
	this.removed = false;
}

function Person(id, name, keywords,articles){
	this.id = id || 0;
	this.name = name;
	this.keywords = keywords || [];
	this.articles = articles || [];
	this.selected = false;
}

