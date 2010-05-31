/********** Worker.Dashboard **********
* Displays statistics and other useful info
*/
var Dashboard = new Worker('Dashboard');

Dashboard.settings = {
	keep:true
};

Dashboard.defaults = {
	castle_age:{
		pages:'*'
	}
};

Dashboard.option = {
	display:'block',
	active:null
};

Dashboard.init = function() {
	var id, $btn, tabs = [], divs = [], active = this.option.active;
	for (i=0; i<Workers.length; i++) {
		if (Workers[i].dashboard) {
			id = 'golem-dashboard-'+Workers[i].name;
			if (!active) {
				this.option.active = active = id;
			}
			tabs.push('<h3 name="'+id+'" class="golem-tab-header' + (active===id ? ' golem-tab-header-active' : '') + '">' + (Workers[i] === this ? '&nbsp;*&nbsp;' : Workers[i].name) + '</h3>');
			divs.push('<div id="'+id+'"'+(active===id ? '' : ' style="display:none;"')+'></div>');
			this._watch(Workers[i]);
		}
	}
	$('<div id="golem-dashboard" style="top:' + $('#app'+APPID+'_main_bn').offset().top+'px;display:' + this.option.display+';">' + tabs.join('') + '<div>' + divs.join('') + '</div></div>').prependTo('.UIStandardFrame_Content');
	$('.golem-tab-header').click(function(){
		if ($(this).hasClass('golem-tab-header-active')) {
			return;
		}
		if (Dashboard.option.active) {
			$('h3[name="'+Dashboard.option.active+'"]').removeClass('golem-tab-header-active');
			$('#'+Dashboard.option.active).hide();
		}
		Dashboard.option.active = $(this).attr('name');
		$(this).addClass('golem-tab-header-active');
		Dashboard.update();
		$('#'+Dashboard.option.active).show();
		Dashboard._save('option');
	});
	$('#golem-dashboard .golem-panel > h3').live('click', function(event){
		if ($(this).parent().hasClass('golem-panel-show')) {
			$(this).next().hide('blind',function(){$(this).parent().toggleClass('golem-panel-show');});
		} else {
			$(this).parent().toggleClass('golem-panel-show');
			$(this).next().show('blind');
		}
	});
	$('#golem-dashboard thead th').live('click', function(event){
		var worker = WorkerByName(Dashboard.option.active.substr(16));
		worker._unflush();
		worker.dashboard($(this).prevAll().length, $(this).attr('name')==='sort');
	});

	$('#golem_buttons').append('<img class="golem-button' + (Dashboard.option.display==='block'?'-active':'') + '" id="golem_toggle_dash" src="data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%1EPLTE%BA%BA%BA%EF%EF%EF%E5%E5%E5%D4%D4%D4%D9%D9%D9%E3%E3%E3%F8%F8%F8%40%40%40%FF%FF%FF%00%00%00%83%AA%DF%CF%00%00%00%0AtRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%00%B2%CC%2C%CF%00%00%00EIDATx%DA%9C%8FA%0A%00%20%08%04%B5%CC%AD%FF%7F%B8%0D%CC%20%E8%D20%A7AX%94q!%7FA%10H%04%F4%00%19*j%07Np%9E%3B%C9%A0%0C%BA%DC%A1%91B3%98%85%AF%D9%E1%5C%A1%FE%F9%CB%14%60%00D%1D%07%E7%0AN(%89%00%00%00%00IEND%AEB%60%82">');
	$('#golem_toggle_dash').click(function(){
		$(this).toggleClass('golem-button golem-button-active');
		Dashboard.option.display = Dashboard.option.display==='block' ? 'none' : 'block';
		if (Dashboard.option.display === 'block' && !$('#'+Dashboard.option.active).children().length) {
			WorkerByName(Dashboard.option.active.substr(16)).dashboard();
		}
		$('#golem-dashboard').toggle('drop');
		Dashboard._save('option');
	});
	window.setInterval(function(){
		$('.golem-timer').each(function(i,el){
			var time = $(el).text().parseTimer();
			if (time && time > 0) {
				$(el).text(makeTimer($(el).text().parseTimer() - 1));
			} else {
				$(el).removeClass('golem-timer').text('now?');
			}
		});
		$('.golem-time').each(function(i,el){
			var time = parseInt($(el).attr('name')) - Date.now();
			if (time && time > 0) {
				$(el).text(makeTimer(time / 1000));
			} else {
				$(el).removeClass('golem-time').text('now?');
			}
		});
	},1000);
};

Dashboard.parse = function(change) {
	$('#golem-dashboard').css('top', $('#app'+APPID+'_main_bn').offset().top+'px');
};

Dashboard.update = function(type) {
	if (!this._loaded || (type && typeof type !== 'object')) {
		return;
	}
	worker = type || WorkerByName(Dashboard.option.active.substr(16));
	var id = 'golem-dashboard-'+worker.name;
	if (this.option.active === id && this.option.display === 'block') {
		try {
			worker._unflush();
			worker.dashboard();
		}catch(e) {
			log(this.name,e.name + ' in ' + worker.name + '.dashboard(): ' + e.message);
		}
	} else {
		$('#'+id).empty();
	}
};

Dashboard.dashboard = function() {
	var i, list = [];
	for (i=0; i<Workers.length; i++) {
		if (this.data[Workers[i].name]) {
			list.push('<tr><th>' + Workers[i].name + ':</th><td id="golem-status-' + Workers[i].name + '">' + this.data[Workers[i].name] + '</td></tr>');
		}
	}
	list.sort(); // Ok with plain text as first thing that can change is name
	$('#golem-dashboard-Dashboard').html('<table cellspacing="0" cellpadding="0" class="golem-status">' + list.join('') + '</table>');
};

Dashboard.status = function(worker, html) {
	if (html) {
		this.data[worker.name] = html;
	} else {
		delete this.data[worker.name];
	}
	this._save();
};
