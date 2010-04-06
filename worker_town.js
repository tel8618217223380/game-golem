/********** Worker.Town **********
* Sorts and auto-buys all town units (not property)
*/
var Town = new Worker('Town', 'town_soldiers town_blacksmith town_magic');
Town.data = {};

Town.option = {
	number:'Minimum',
	maxcost:'$100k',
	units:'All',
	sell:false
};

Town.runtime = {
	best:null,
	buy:0,
	cost:0
};

Town.display = [
	{
		label:'Work in progress...'
	},{
		id:'number',
		label:'Buy Number',
		select:['None', 'Minimum', 'Match Army', 'Maximum'],
		help:'Minimum will buy before any quests (otherwise only bought when needed), Maximum will buy 501 (depending on generals)'
	},{
		advanced:true,
		id:'maxcost',
		label:'Maximum Buy Cost',
		select:['$10k','$100k','$1m','$10m','$100m','$1b','$10b','$100b']
	},{
		advanced:true,
		id:'units',
		label:'Buy Type',
		select:['All', 'Best Offense', 'Best Defense', 'Best of Both']
	},{
		advanced:true,
		id:'sell',
		label:'Auto-Sell<br>(Not enabled)',
		checkbox:true
	}
];

Town.blacksmith = { // Shield must come after armor (currently)
	Weapon:	/avenger|axe|blade|bow|cudgel|dagger|halberd|mace|morningstar|rod|saber|spear|staff|stave|sword|talon|trident|wand|Daedalus|Dragonbane|Dreadnought Greatsword|Excalibur|Incarnation|Ironhart's Might|Judgement|Justice|Lightbringer|Oathkeeper|Onslaught/i,
	Shield:	/buckler|shield|tome|Defender|Dragon Scale|Frost Dagger|Frost Tear Dagger|Harmony|Sword of Redemption|The Dreadnought/i,
	Helmet:	/cowl|crown|helm|horns|mask|veil/i,
	Gloves:	/gauntlet|glove|hand|bracer|Slayer's Embrace/i,
	Armor:	/armor|chainmail|cloak|pauldrons|plate|robe|Blood Vestment|Faerie Wings|Ogre Raiments/i,
	Amulet:	/amulet|bauble|charm|eye|heart|jewel|lantern|memento|orb|shard|soul|talisman|trinket|Paladin's Oath|Poseidons Horn/i
};

Town.init = function() {
	if (this.data.soldiers || this.data.blacksmith || this.data.magic) { // Need to reparse with new code...
		this.data = {};
		delete Page.data.town_soldiers;
		delete Page.data.town_blacksmith;
		delete Page.data.town_magic;
	}
};

Town.parse = function(change) {
	if (!change) {
		var unit = Town.data, page = Page.page.substr(5);
		$('.eq_buy_row,.eq_buy_row2').each(function(a,el){
			var i, stats = $('div.eq_buy_stats', el), name = $('.eq_buy_txt strong:first', el).text().trim(), costs = $('div.eq_buy_costs', el), cost = $('strong:first-child', costs).text().replace(/[^0-9]/g, '');
			unit[name] = unit[name] || {};
			unit[name].page = page;
			unit[name].img = $('div.eq_buy_image img', el).attr('src').filepart();
			unit[name].own = $('span:first-child', costs).text().regex(/Owned: ([0-9]+)/i);
			unit[name].att = $('.eq_buy_stats_int div:eq(0)', stats).text().regex(/([0-9]+)\s*Attack/);
			unit[name].def = $('.eq_buy_stats_int div:eq(1)', stats).text().regex(/([0-9]+)\s*Defense/);
			if (cost) {
				unit[name].cost = parseInt(cost, 10);
				unit[name].buy = [];
				$('select[name="amount"]:first option', costs).each(function(i,el){
					unit[name].buy.push(parseInt($(el).val(), 10));
				});
			}
			if (page === 'blacksmith') {
				for (i in Town.blacksmith) {
					if (name.match(Town.blacksmith[i])) {
						unit[name].type = i;
					}
				}
			}
		});
	} else if (Page.page==='town_blacksmith') {
		$('.eq_buy_row,.eq_buy_row2').each(function(i,el){
			var $el = $('div.eq_buy_txt strong:first-child', el), name = $el.text().trim();
			if (Town.data[name].type) {
				$el.parent().append('<br>'+Town.data[name].type);
			}
		});
	}
	return true;
};

Town.getInvade = function(army) {
	var att = 0, def = 0, data = this.data;
	att += getAttDef(data, function(list,i,units){if (units[i].page==='soldiers'){list.push(i);}}, 'att', army, 'invade');
	def += getAttDef(data, null, 'def', army, 'invade');
	att += getAttDef(data, function(list,i,units){if (units[i].type && units[i].type !== 'Weapon'){list.push(i);}}, 'att', army, 'invade');
	def += getAttDef(data, null, 'def', army, 'invade');
	att += getAttDef(data, function(list,i,units){if (units[i].type === 'Weapon'){list.push(i);}}, 'att', army, 'invade');
	def += getAttDef(data, null, 'def', army, 'invade');
	att += getAttDef(data, function(list,i,units){if (units[i].page==='magic'){list.push(i);}}, 'att', army, 'invade');
	def += getAttDef(data, null, 'def', army, 'invade');
	return {attack:att, defend:def};
};

Town.getDuel = function() {
	var att = 0, def = 0, data = this.data;
	att += getAttDef(data, function(list,i,units){if (units[i].type === 'Weapon'){list.push(i);}}, 'att', 1, 'duel');
	def += getAttDef(data, null, 'def', 1, 'duel');
	att += getAttDef(data, function(list,i,units){if (units[i].page==='magic'){list.push(i);}}, 'att', 1, 'duel');
	def += getAttDef(data, null, 'def', 1, 'duel');
	att += getAttDef(data, function(list,i,units){if (units[i].type === 'Shield'){list.push(i);}}, 'att', 1, 'duel');
	def += getAttDef(data, null, 'def', 1, 'duel');
	att += getAttDef(data, function(list,i,units){if (units[i].type === 'Helmet'){list.push(i);}}, 'att', 1, 'duel');
	def += getAttDef(data, null, 'def', 1, 'duel');
	att += getAttDef(data, function(list,i,units){if (units[i].type === 'Gloves'){list.push(i);}}, 'att', 1, 'duel');
	def += getAttDef(data, null, 'def', 1, 'duel');
	att += getAttDef(data, function(list,i,units){if (units[i].type === 'Armor'){list.push(i);}}, 'att', 1, 'duel');
	def += getAttDef(data, null, 'def', 1, 'duel');
	att += getAttDef(data, function(list,i,units){if (units[i].type === 'Amulet'){list.push(i);}}, 'att', 1, 'duel');
	def += getAttDef(data, null, 'def', 1, 'duel');
	return {attack:att, defend:def};
};

Town.update = function(type) {
	var i, u, best = null, buy = 0, data = this.data, quests, army = Player.get('army'), max = (this.option.number === 'Match Army' ? army : (this.option.number === 'Maximum' ? 501 : 0));
	this.option.invade = this.getInvade(army);
	this.option.duel = this.getDuel();
	if (this.option.number !== 'None') {
		quests = Quest.get();
		for (i in quests) {
			if (quests[i].units) {
				for (u in quests[i].units) {
					if (data[u] && data[u].cost && data[u].own < quests[i].units[u]) {
						best = u;
						buy = quests[i].units[u] - data[u].own;
					}
				}
			}
		}
	}
	/*
//		if (!units[i].cost || units[i].own >= max || (best && Town.option.units === 'Best Offense' && units[i].att <= best.att) || (best && Town.option.units === 'Best Defense' && units[i].def <= best.def) || (best && Town.option.units === 'Best of Both' && (units[i].att <= best.att || units[i].def <= best.def))) {
	if (max && !best) {
		for (i in data) {
			if (data[i].cost && data[i].own < max) {
				best = Math.max(data[u].need, max - data[u].own);
			}
		}
	}
	*/
	this.runtime.best = best;
	if (best) {
		this.runtime.buy = buy;
		this.runtime.cost = buy * data[best].cost;
		Dashboard.status(this, 'Want to buy ' + buy + ' x ' + best + ' for $' + addCommas(this.runtime.cost));
	} else {
		Dashboard.status(this);
	}
};

Town.work = function(state) {
	if (!this.runtime.best || !this.runtime.buy || !Bank.worth(this.runtime.cost)) {
		return false;
	}
	if (!state || !Bank.retrieve(this.runtime.cost) || (this.data[this.runtime.best].page === 'soldiers' && !Generals.to('cost')) || !Page.to('town_'+this.data[this.runtime.best].page)) {
		return true;
	}
	$('.eq_buy_row,.eq_buy_row2').each(function(i,el){
		if ($('.eq_buy_txt strong:first', el).text().trim() === Town.runtime.best) {
			debug('Town: Buying ' + Town.runtime.buy + ' x ' + Town.runtime.best + ' for $' + addCommas(Town.runtime.cost));
			$('.eq_buy_costs select[name="Amount"]:eq(0)', el).val(Town.runtime.buy > 5 ? 10 : (Town.runtime.buy > 1 ? 5 : 1));
			Page.click($('.eq_buy_costs input[name="Buy"]', el));
		}
	});
	return true;
};

var makeTownDash = function(list, unitfunc, x, type, name, count) { // Find total att(ack) or def(ense) value from a list of objects (with .att and .def)
	var units = [], output = [], x2 = (x==='att'?'def':'att'), i, order = {Weapon:1, Shield:2, Helmet:3, Armor:4, Amulet:5, Gloves:6, Magic:7};
	if (name) {
		output.push('<div class="golem-panel"><h3 class="golem-panel-header">'+name+'</h3><div class="golem-panel-content">');
	}
	for (i in list) {
		unitfunc(units, i, list);
	}
	if (list[units[0]]) {
		if (type === 'duel' && list[units[0]].type) {
			units.sort(function(a,b) {
				return order[list[a].type] - order[list[b].type];
			});
		} else if (list[units[0]] && list[units[0]].skills && list[units[0]][type]) {
			units.sort(function(a,b) {
				return (list[b][type][x] || 0) - (list[a][type][x] || 0);
			});
		} else {
			units.sort(function(a,b) {
				return (list[b][x] + (0.7 * list[b][x2])) - (list[a][x] + (0.7 * list[a][x2]));
			});
		}
	}
	for (i=0; i<(count ? count : units.length); i++) {
		if ((list[units[0]] && list[units[0]].skills) || (list[units[i]].use && list[units[i]].use[type+'_'+x])) {
			output.push('<div style="height:25px;margin:1px;"><img src="' + imagepath + list[units[i]].img + '" style="width:25px;height:25px;float:left;margin-right:4px;">' + (list[units[i]].use ? list[units[i]].use[type+'_'+x]+' x ' : '') + units[i] + ' (' + list[units[i]].att + ' / ' + list[units[i]].def + ')' + (list[units[i]].cost?'<br>$'+addCommas(list[units[i]].cost):'') + '</div>');
		}
	}
	if (name) {
		output.push('</div></div>');
	}
	return output.join('');
};

Town.dashboard = function() {
	var left, right, generals = Generals.get(), duel = {}, best;
	best = Generals.best('duel');
	left = '<div style="float:left;width:50%;"><div class="golem-panel"><h3 class="golem-panel-header">Invade - Attack</h3><div class="golem-panel-content" style="padding:8px;">'
			+	makeTownDash(generals, function(list,i){list.push(i);}, 'att', 'invade', 'Heroes')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='soldiers' && units[i].use){list.push(i);}}, 'att', 'invade', 'Soldiers')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].use && units[i].type === 'Weapon'){list.push(i);}}, 'att', 'invade', 'Weapons')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].use && units[i].type !== 'Weapon'){list.push(i);}}, 'att', 'invade', 'Equipment')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='magic' && units[i].use){list.push(i);}}, 'att', 'invade', 'Magic')
			+	'</div></div><div class="golem-panel"><h3 class="golem-panel-header">Duel - Attack</h3><div class="golem-panel-content" style="padding:8px;">'
			+	(best !== 'any' ? '<div style="height:25px;margin:1px;"><img src="' + imagepath + generals[best].img + '" style="width:25px;height:25px;float:left;margin-right:4px;">' + best + ' (' + generals[best].att + ' / ' + generals[best].def + ')</div>' : '')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='blacksmith' && units[i].use){list.push(i);}}, 'att', 'duel')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='magic' && units[i].use){list.push(i);}}, 'att', 'duel')
			+'</div></div></div>';
	best = Generals.best('defend');
	right = '<div style="float:right;width:50%;"><div class="golem-panel"><h3 class="golem-panel-header">Invade - Defend</h3><div class="golem-panel-content" style="padding:8px;">'
			+	makeTownDash(generals, function(list,i){list.push(i);}, 'def', 'invade', 'Heroes')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='soldiers' && units[i].use){list.push(i);}}, 'def', 'invade', 'Soldiers')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].use && units[i].type === 'Weapon'){list.push(i);}}, 'def', 'invade', 'Weapons')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].use && units[i].type !== 'Weapon'){list.push(i);}}, 'def', 'invade', 'Equipment')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='magic' && units[i].use){list.push(i);}}, 'def', 'invade', 'Magic')
			+	'</div></div><div class="golem-panel"><h3 class="golem-panel-header">Duel - Defend</h3><div class="golem-panel-content" style="padding:8px;">'
			+	(best !== 'any' ? '<div style="height:25px;margin:1px;"><img src="' + imagepath + generals[best].img + '" style="width:25px;height:25px;float:left;margin-right:4px;">' + best + ' (' + generals[best].att + ' / ' + generals[best].def + ')</div>' : '')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='blacksmith' && units[i].use){list.push(i);}}, 'def', 'duel')
			+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='magic' && units[i].use){list.push(i);}}, 'def', 'duel')
			+'</div></div></div>';

	$('#golem-dashboard-Town').html(left+right);
};
