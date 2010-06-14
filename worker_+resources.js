/********** Worker.Resources **********
* Store and report Resourcess

Workers can add a type of Resources that they supply - Player would supply Energy and Stamina when parsing etc
Workers request buckets of Resourcess during init() - each bucket gets a display in the normal Resources config panel.

Resources stores the buckets as well as an overflow bucket - the overflow is used during level up

Buckets may be either -
"Shared" buckets are like now - first-come, first-served from a single source
- or -
"Exclusive" buckets are filled by a drip system, forcing workers to share Resourcess

The Shared bucket has a priority of 0

When there is a combination of Shared and Exclusive, the relative priority of the buckets are used - total of all priorities / number of buckets.
Priority is displayed as -5, -4, -3, -2, -1, 0, +1, +2, +3, +4, +5

When a worker is disabled (Queue.option.enabled[worker] === false) then it's bucket is completely ignored and Resourcess are shared to other buckets.

Buckets are filled in priority order, in cases of same priority, alphabetical order is used
*/

var Resources = new Worker('Resources');
Resources.settings = {
	system:true,
	unsortable:true
};

Resources.option = {
	types:{},
	buckets:{}
};

Resources.runtime = {
	types:{},// {'Energy':true}
	buckets:{}
};

Resources.display = function() {
	var type, worker, require, display = [];
	if (!length(this.runtime.types)) {
		return 'Discovering Resources...';
	}
	display.push({label:'Not doing anything yet...'});
	for (type in this.option.types) {
		display.push({
			title:type
		},{
			id:'types.'+type,
			label:'Bucket Type',
			select:{0:'None',1:'Shared',2:'Exclusive'}
		});
		for (worker in this.runtime.buckets) {
			if (type in this.runtime.buckets[worker]) {
				require = {};
//				require['buckets.'+worker+'.'+type] = 2;
				require['types.'+type] = 2;
				display.push({
					id:'buckets.'+worker+'.priority',
					require:require,
					label:'...<b>'+worker+'</b> priority',
					select:{0:'-5',1:'-4',2:'-3',3:'-2',4:'-1',5:'0',6:'+1',7:'+2',8:'+3',9:'+4',10:'+5'}
				});
			}
		}
	}
	return display;
};

Resources.init = function() {
//	Config.addOption({label:'test',checkbox:true});
};

/***** Resources.addType() *****
Add a type of Resources
*/
Resources.addType = function(type) {
	WorkerStack.push(this);
	this.set(['runtime','types',type], this.get(['runtime','types',type], 0));
	this.set(['option','types',type], this.get(['option','types',type], true));
	Config.makePanel();
	WorkerStack.pop();
};

/***** Resources.useType() *****
Register to use a type of resource
Actually use a type of resource (must register with no amount first)
*/
Resources.useType = function(type, amount) {
	if (!WorkerStack.length) {
		return;
	}
	var worker = WorkerStack[WorkerStack.length-1];
	if (typeof amount === 'undefined') {
//		this.set(['runtime','types',type], this.get(['runtime','types',type], 0));
//		this.set(['option','types',type], this.get(['option','types',type], true));
		this.set(['runtime','buckets',worker.name,type], this.get(['runtime','buckets',worker.name,type], 0));
		this.set(['option','buckets',worker.name,type], this.get(['option','buckets',worker.name,type], 1));
		this.set(['option','buckets',worker.name,'priority'], this.get(['option','buckets',worker.name,'priority'], 5));
	} else {
	}
};

/***** Resources.add() *****
type = name of Resources
amount = amount to add
abs = is an absolute amount, not relative
1. Set the amount we have to the new value
2. If we've gained, then share some out
*/
Resources.add = function(type, amount, abs) {
	var change, old = this.get(['runtime','types',type], 0);
	if (abs) {
		change = amount - old;
		this.set(['runtime','types',type], amount);
	} else {
		change = amount;
		this.set(['runtime','types',type], amount + old);
	}
//	if (change > 0) {// We've gotten higher, lets share some out...
//	}
};

Resources.get = function(what,def) {
//	log('Resources.get('+what+', '+(def?def:'null')+')');
	return this._get(what,def);
};

Resources.set = function(what,value) {
//	log('Resources.set('+what+', '+(value?value:'null')+')');
	return this._set(what,value);
};

