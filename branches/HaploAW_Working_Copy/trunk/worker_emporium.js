/********** Worker.Emporium **********
* Get all ingredients and recipes
*/
var Emporium = new Worker('Emporium');

Emporium.settings = {
    advanced:true
};

Emporium.defaults = {
	castle_age:{
		pages:'emporium'
	}
};

Emporium.data = {
	ingredients:{},
	prizes:{}
};

Emporium.option = {
	perform:false,
        min: 10
};

Emporium.runtime = {
        choosen:null
};

Emporium.display = [
	{
		id:'perform',
		label:'Automatically Perform',
		checkbox:true
	},{
		id:'min',
		label:'Min items per type',
	        text:true,
	        size:3
	}
];

Emporium.parse = function(change) {
	//debug(this.name,'Parser running.');
	var ingredients = this.data.ingredients = {};
        $('div.ingredientUnit').each(function(i,el){
                // Skip chosen ingredients
                if ($('img[src*="emporium_trade_in"]', el).length > 0) {
                        var name = $('img', el).attr('src').filepart();
                        ingredients[name] = $(el).text().regex(/x([0-9]+)/);
                        //debug('Emporium','Found ingredient '+name+'('+ingredients[name]+')');
		}
	});
	// Detect prizes
	var prize_img=$('div[style*="emporium_pop_up"] div div img:not([src*="skip"])');
	if(prize_img.length>0) {
		var prize=prize_img.attr('src').filepart();
		if(this.data.prizes[prize]) {
			this.data.prizes[prize]++;
		}
		else {
			this.data.prizes[prize]=0;
		}
		debug(this.name, 'Prize '+prize);
	}
};

Emporium.update = function() {
	var choosen = {}, ingredients=this.data.ingredients, i, n = 0;
	//debug(this.name,'Updater running.');
	for (i in ingredients) {
		if (ingredients[i] > this.option.min) {
			choosen[i]=ingredients[i]-this.option.min;
			n += choosen[i];
		}
	}
	if (n > 10) {
		this.runtime.choosen = choosen;
		//debug(this.name,'We have '+n+' ingredients to trade.');
	}
	else {
		this.runtime.choosen = null;
	}
};

Emporium.work = function(state) {
	if (!this.option.perform || !this.runtime.choosen) {
		return false;
	}
	//debug(this.name,'Worker running.');
	if (!state || !Page.to('emporium')) {
		return true;
	}
	var i,j,n=0;
	for (i in this.runtime.choosen) {
	        debug(this.name,'Selecting up to 10 '+i+' for trade.');
		while (n<10 && this.runtime.choosen[i] > 0) {
			if (!Page.click($('img[src*="emporium_trade_in"]', $('div.ingredientUnit img[src*="'+i+'"]').parent().parent()))) {
				Page.reload(); // Can't find the ingredient we just parsed when coming here...
			}
			this.runtime.choosen[i]--;
		    	n++;
		}
		if (n >= 10) {
			debug(this.name,'Emporium full, going to roll.');
			break;
		}
	}
	if (n>=10 && Page.click($('img[src*="emporium_button.gif"]'))) {
	        //debug(this.name,'Traded.');
		return true;
	}
        //debug(this.name,'Finished.');
	return false;
};
