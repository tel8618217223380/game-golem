/********** Worker.Update **********
* Checks if there's an update to the script, and lets the user update if there is.
*/
var Update = new Worker('Update');
Update.data = null;
Update.option = null;

Update.settings = {
	gm_only:true,// We need the cross-site ajax for our update checks
	system:true
};

Update.runtime = {
	lastcheck:0,// Date.now() = time since last check
	force:false// Have we clicked a button, or is it an automatic check
};

Update.found = false;
Update.looking = false;

/***** Update.init() *****
1a. Add a "Update Now" button to the button bar at the top of Config
1b. If running a beta version then add a "beta" button - which makes us pretend to be a beta version before running the update check.
2. On clicking the button set Update.runtime.force to true - so we can work() immediately...
*/
Update.init = function() {
	var $btn = $('<img class="golem-button" name="Check for Updates" id="golem_update" src="' + (isRelease ? Images.update : Images.beta) + '">').click(function(){
		$(this).addClass('red');
		Update.runtime.force = true;
	});
	$('#golem_buttons').append($btn);
	if (isRelease) {
		$btn = $('<img class="golem-button golem-advanced"' + (Config.get('option.advanced') ? '' : ' style="display:none;"') + ' name="Check for Beta Versions" src="' + Images.beta + '">').click(function(){
			$(this).addClass('red');
			isRelease = false;// Isn't persistant, so nothing visible to the user except the beta release
			Update.runtime.force = true;
		});
		$('#golem_buttons').append($btn);
	}
};

/***** Update.work() *****
1a. Check that we've not already found an update
1b. Check that it's been more than 6 hours since the last update
2a. Use AJAX to get the google trunk source webpage (list of files and revisions)
2b. Parse out the revision string for both release and beta
3. Display a notification if there's a new version - 
*/
Update.work = function(state) {
	if (!this.found && !this.looking && (this.runtime.force || Date.now() - this.runtime.lastcheck > 21600000)) {// 6+ hours since last check (60x60x6x1000ms)
		this.looking = true;
		this.runtime.lastcheck = Date.now();
		debug('Checking trunk revisions');
		GM_xmlhttpRequest({ // Cross-site ajax, only via GreaseMonkey currently...
			method: "GET",
			url: 'http://code.google.com/p/game-golem/source/browse/#svn/trunk',
			onload: function(evt) {
				if (evt.readyState === 4 && evt.status === 200) {
					var file, $btn;
					file = evt.responseText.regex(/"trunk":{".*"_release.user.js":\["[^"]*","([0-9]+)","([^"]*)"/i);
					if (file[0] > revision) {
						$('#golem_buttons').after('<div class="golem-button golem-info green" title="r' + file[0] + ' released ' + file[1] + ', currently on r' + revision +'"><a href="http://game-golem.googlecode.com/svn/trunk/_release.user.js">New Version Available</a></div>');
						Update.found = true;
						log('New version available: '+file[0]+', currently on r'+revision);
					}
					if (!isRelease) {
						file = evt.responseText.regex(/"trunk":{".*"_normal.user.js":\["[^"]*","([0-9]+)","([^"]*)"/i);
						if (file[0] > revision) {
							$('#golem_buttons').after('<div class="golem-button golem-info green" title="r' + file[0] + ' released ' + file[1] + ', currently on r' + revision +'"><a href="http://game-golem.googlecode.com/svn/trunk/_normal.user.js">New Beta Available</a></div>');
							Update.found = true;
							log('New revision available: '+file[0]+', currently on r'+revision);
						}
					}
					if (Update.runtime.force && !Update.found) {
						$btn = $('<div class="golem-button golem-info red">No Update Found</div>').animate({'z-index':0}, {
							duration:5000,
							complete:function(){$(this).remove();}
						});
						$('#golem_buttons').after($btn);
						log('No new releaases');
					}
					Update.runtime.force = Update.looking = false;
					$('#golem_update').removeClass('red');
				}
			}
		});
	}
};
