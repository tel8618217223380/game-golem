// ==UserScript==
// @name		Rycochet's Castle Age Golem
// @namespace	golem
// @description	Auto player for Castle Age on Facebook. If there's anything you'd like it to do, just ask...
// @license		GNU Lesser General Public License; http://www.gnu.org/licenses/lgpl.html
// @version		31.4
// @include		http://apps.facebook.com/castle_age/*
// @include		https://apps.facebook.com/castle_age/*
// @require		http://cloutman.com/jquery-latest.min.js
// @require		http://cloutman.com/jquery-ui-latest.min.js
// ==/UserScript==
// @disabled-include		http://apps.facebook.com/reqs.php
// @disabled-include		https://apps.facebook.com/reqs.php
// 
// For the source code please check the sourse repository
// - http://code.google.com/p/game-golem/
// 
// For the unshrunk Work In Progress version (which may introduce new bugs)
// - http://game-golem.googlecode.com/svn/trunk/_normal.user.js
var version = "31.5";
var revision = 757;
/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	GM_log, GM_setValue, GM_getValue, localStorage, console, window, unsafeWindow:true, revision, version, do_css, jQuery,
	Workers, QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
// User changeable
var show_debug = true;

// Shouldn't touch
var isRelease = false;
var script_started = Date.now();
var first_timer = window.setTimeout(function(){return;},0);

// Automatically filled
var userID = 0;
var imagepath = '';
var isGreasemonkey = (typeof GM_log === 'function');

// Decide which facebook app we're in...
if (window.location.hostname.match(/\.facebook\.com$/i)) {
	var applications = {
		'reqs.php':['','Gifts'], // For gifts etc
		'castle_age':['46755028429', 'Castle Age']
	};

	for (var i in applications) {
		if (window.location.pathname.indexOf(i) === 1) {
			var APP = i;
			var APPID = applications[i][0];
			var APPNAME = applications[i][1];
			var PREFIX = 'golem'+APPID+'_';
			break;
		}
	}
	if (typeof APP === 'undefined') {
		console.log('GameGolem; Unknown facebook application...');
	} else {
		var log = function(txt){
			console.log('[' + (new Date()).toLocaleTimeString() + '] ' + Worker.current + ': ' + $.makeArray(arguments).join("\n"));
		};
		if (show_debug) {
			var debug = function(txt) {
				console.log('[' + (isRelease ? 'v'+version : 'r'+revision) + '] [' + (new Date()).toLocaleTimeString() + '] ' + Worker.current + ': ' + $.makeArray(arguments).join("\n"));
			};
		} else {
			var debug = function(){};
		}

		if (typeof unsafeWindow === 'undefined') {
			var unsafeWindow = window;
		}

		var document_ready = function() {
			var i = 0;
			try {
				userID = $('script').text().regex(/user:([0-9]+),/i);
			} catch(e) {
				if (i++ < 5) {// Try 5 times before we give up...
					window.setTimeout(document_ready, 1000);
					return;
				}
			}
			if (!userID || typeof userID !== 'number' || userID === 0) {
				log('ERROR: No Facebook UserID!!!');
				window.setTimeout(Page.reload, 5000); // Force reload without retrying
				return;
			}
			if (APP === 'reqs.php') { // Let's get the next gift we can...
				return;
			}
			try {
				imagepath = $('#app'+APPID+'_globalContainer img:eq(0)').attr('src').pathpart();
			} catch(e) {
				log('ERROR: Bad Page Load!!!');
				window.setTimeout(Page.reload, 5000);
				return;
			}
			do_css();
			Page.identify();
			for (i in Workers) {
				Workers[i]._setup();
			}
			for (i in Workers) {
				Workers[i]._init();
			}
			for (i in Workers) {
				Workers[i]._update();
				Workers[i]._flush();
			}
			Page.parse_all(); // Call once to get the ball rolling...
		};

		if (typeof jQuery !== 'undefined') {
			$(document).ready(document_ready);
		} else {
			var head = document.getElementsByTagName('head')[0] || document.documentElement, a = document.createElement('script'), b = document.createElement('script');
			a.type = b.type = 'text/javascript';
			a.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js';
			b.src = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.1/jquery-ui.min.js';
			head.appendChild(a);
			head.appendChild(b);
			log('Loading jQuery & jQueryUI');
			(function jQwait() {
				log('...loading... jQuery: '+typeof jQuery+', window.jQuery: '+typeof unsafeWindow.jQuery);
				if (typeof window.jQuery === 'undefined') {
					window.setTimeout(jQwait, 10000);
				} else {
					log('jQuery Loaded...');
					$(document).ready(document_ready);
				}
			})();
		}
	}
}

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	Images:true, makeImage:true
*/
/********** CSS code **********
* Gets pushed into the <head> on loading
* Also contains all inlined images (for later theming...)
*/
var Images = {};

Images.blank = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%06PLTE%FF%FF%FF%00%00%00U%C2%D3~%00%00%00%01tRNS%00%40%E6%D8f%00%00%00%0FIDATx%DAb%60%18%05%C8%00%20%C0%00%01%10%00%01%3BBBK%00%00%00%00IEND%AEB%60%82";
Images.energy = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%02%19PLTE%FD%FD%FE%FE%FE%FE%F9%8E%14%0EU%806o%94%0CDo%0BV%92%19Z%8C%DB%D4%CA%0BHtJ_g%2Fo%95%0EL%7B%FB%FC%FC%89%5C%20%89%5D%23%16Q%81%17S%82%09M%86E%7F%A4%FC%FD%FE%19X%83%00%3Dg%1BV%7D%A8%C0%CD%16W%8A%91Z%17%07Fn%E7%ED%F0%E6%ED%F2X%8C%AB%25%60%8FgbGG%7D%9B%E3%88%1C%FB%F7%F3%01-H%E7%8B%1C%EC%A0A%9E%BD%CFLZV%C5%D6%E2o%9C%B4NRP%DE%82%15%EF%95)%FA%91%1B%0A%40p%C6z%1A%19%60%94%EC%EE%F1%BEs%15%FA%FB%FBBdq%0EO%86%07DiLcn%F7%98%24%7Cs%5C%15V%80%AA%C1%CE%1EU%7F%BD%D2%DF%FC%FD%FD%1CQv%3De~%12U%80*a%87%0FGy%84%80l%10Gs%C7%90I%FB%FC%FD%F8%F7%F4mfH%13Nv%C0%CC%D6%E0%D3%C3-%5E%87%E3%E8%E9%1C_%8AOr%8FS%5BYL%84%A6%0DCp%2FQd%CA%D9%E1%EB%ABTx%98%A4%03%3Fm%D7%E1%E4%F9%8E%15%5Bge%A3%C1%D5%09Ir%82f7%F3%EC%E4%0DK%7B%15Q%83%00Ex%13%2FI%12S%89%ED%8D%19AE%3Dt%9F%B9%EF%F2%F4%26%5E%89rZ%3A%05Bl)i%8Dvzq%CB~%22w%A0%B8%C6%D4%E0%A0%BE%CD%E8%A3A3LZ%2Ff%90%17%5C%89%EF%E8%DB%04P%8F%E3%EC%F0%F4%90%178n%8C%C2%D5%E0%E5%EA%EDHNF%F1%8F%1AHh%7C%FE%FA%F4%0B%40b2Xm%A3%BF%D3G~%A5%18Ip%13Mz%8E%AD%C1%18Z%8E%1CY%87%0ADnS%8B%AC6o%92%EB%8B%19%20V%7F%E8%ED%F0I%5Eey%80v%C5%D6%E0%17V%85%E5%EC%EF%B3%CA%D5%EF%93%1B%E0%D7%CC%15S%7F%EA%8F%22%E9%94%2B.n%97%26f%8E%13M%7C%0AT%93D%7B%9D%A3g%1Ej%99%B1%D3%DE%E4%60%94%AF3s%9D%F5%90%20j%95%AEadS%F7%992%0FGw%85%AA%BE%0FKy%DC%E4%EB%22%5E%90%1Ee%9F%ACq%2B%0CY%9A%FF%FF%FF%81%9F%22%D3%00%00%00%B3tRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00%0F)%BF%E8%00%00%00%ECIDATx%DAb%D8%B4iScx%B1%A7%87%89%FD%260%60%00be%5D%D5%88%25%CB%8B*a%02%0C%3E%B3%94LsKYzbE%20%02%D3%AA%F3%FB%B8%E4%FD%B2%FA%7B%5B%40%D2%9B%A6%0A%9Bo%A8%9A%B8%91%BDsJ%DB%9C0%90%80%BA%F8%AAx%BD%98%C0I%CE%92%02%ED%05%B2%40%01%B9y%82%0A%D3%DD%D5f%3B%1Avy%2B.%06%0A%04%3B%94%05E%EB%18%A45%AC_g%3BW%02(%D0%CAj%16%CA%9F%9E%CDd1%3F%C9-%C0%06(%90!%ED%92%D8%5D%B1%A2%DE*%AFYlA%14P%A0pf%0EO*%9B%C6%B2%95%96%DA%C9%AB3%81%02F%8B8%F5%D7%08%95%2C%942%AE%5B%EA%0Fv%98%8CV%5CdHS%8A%0A%9F%AB%26%23%C4%2F%13%3A%B8%9D%98%ADE%BDf0B%3D%B7%89%B7v%B2%5D%CDZ%0E_%98o%A1%A0%3C%01D%02%04%18%00M%2Frc%09%13M%1C%00%00%00%00IEND%AEB%60%82";
Images.exp = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%01%E9PLTE%FFs%01%FE%FE%FE%DDd%07%E7%ED%F0%E0%EA%EE%FC%FD%FE%009a%88%3D%12V%86%A6k%99%B1%1AT%826o%93%0FLy%0DLxf8%25%A3%BF%D3%A3%C1%D5%EEk%02%07BnF%7D%A3%05%40l%1FT%80%04%3Ae%88F%20D%3ED%09Du%19U%83%BBT%0B%D7%E1%E4%00!P%CC%5C%07%E3%E8%E9w6%11%DDd%08%8C%B2%C6%8E%B2%C7%00%0E%3C%EEk%03%1CW%7C%F3%F4%F5%A6%BE%CD%22%3BT%F1%F4%F5%12S%86%14M%7B%00%10%40%D2%DE%E3%22%0F!%00Fq%04%3Dh%DDd%06%C5%D4%DE%A4%C0%CFw6%1B%EEk%01o%9B%B4%005c%00%1CI%2Ff%90%13Dk%0FN%7C%3Bu%99R%8B%AC%1CQv5o%94%F7%F9%FA0o%95%E8%ED%F03%40Ka%93%AC%EEk%04%9A%BB%CD%BBT%0D%CC%5C%0A%17%5D%88U.(%84%AA%BE%99G%15%05%3Bg%15T%7B6p%93%FD%FD%FD%00.V%96%B6%C9%1DU%81w6%17%00%2CV%20W~6n%92%A3%BF%D4G~%A2%20W%7Fw6%0E%A4%C1%D5D03%0BGt%00%25Vf.%153%2F%3F%1E%5D%86%05BrU%409%08%3Fk%02%3Dk-g%8F%0AAp%09Ir%A4%BC%CA3%1C%2B%2Fh%8B2b%8Ao%97%B1%C9%D9%E1Dy%97._%88-_%87%22.Ir%9A%B0u%9E%B7%C8%D6%DE%0DGiD%2F%2F%114W%22%3BRS%8B%AC%00%1DM%C1%D1%DE%1BT%83%00%3Ai%06%3Ag%00%00%2F%000cD%3BB%2Fk%8F%12V%80%AF%C6%D5H~%9F%22(%3B%EC%EE%F1%CC%5C%01%BBT%0C%00%2F%5D'%5D%87t%9E%B9L%84%A6%A4%C0%CE%19%5C%87%C6%D3%DA%26%5E%89%06Bt%0FU%7FS%88%A8%02%3Bh%E9%F0%F3%FA%FB%FC%CC%5C%04%91%AF%C3-m%96%03%3Fm%22%2FH%1FR%7F%BE%D0%DA%FF%FF%FF%F4%06%053%00%00%00%A3tRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00%02%0A%B7%01%00%00%00%DCIDATx%DAbX%84%06%18%40%04%8BI%A9k%FED%16%98%00k%AC%9DCF%AE%15w%8D%00%2BD%202%20%BC%2F%AF%A8xJt%04%FF%2C%90%00sT%C5%02%D1%10.)m%1B%EB%B9%05%8C%40%01w5%3F%89%AAj%17%CD%F9I%253%CAf%02%05%A6%EBXx%C60%F1%F9%1A%C91t%16%EA%01%05%26%D8%B3)%98%B1%EB%F6%9861T%26g%03%05%84%0Degw%B3%AB0%E8%87%BAYN%D2%00%0A%F4%B3%89K'*%E6%A8%0A2%C5%05u%C8%00%05%EAx%C3z%9B%13%BC%3Dj%1B%C4%0C%7C%B4%80%02%5D%9C%F1%99%3CS%5BR%25%EB%85l%E5A%D6.b6%CF%9A%97%96%DE(%92%D2%3A9%10%E2%17%E79Nm%D3%FC%BD8%162%C2%3C%A7n%1C%AC%A4%DC%5E%EE%08%F7-2%00%080%00'%88h7%CBI9%B0%00%00%00%00IEND%AEB%60%82";
Images.gold = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%02%04PLTE%FF%FF%FF%009f%00%3Ag%9F%9Fy%18MyRI%01%5C%92%B5%2Fi%96%E9%DD%93VK%03%E8%ED%F0n%9B%B6%BD%CC%CF%A2%BE%CB%FC%FC%FC%FD%F2%B2%FF%F2%B2SG%00%076W%F3%F4%F4%E2%EC%EE%AC%C2%D4%E7%EC%F0%C3%C5%AA%E6%EA%F0%0EIz%A9%C2%D4%08Dw%F2%F2%D7%FB%FB%FC%08Gz%DA%CC%7Czl%17%AF%9FEgZ%1B%FE%FE%FEi%95%AF%5BV%180r%94i%5B%074u%9An_%0B%8C%AF%C4%00%3Dc2p%94%009%60%E3%EA%EE%25Ss%CD%D8%E1z%83o%EC%E4%A7%8F%AC%BE%E3%D7%8Bdd%2F~n%10%FE%FE%FF%AF%A1L%BD%CB%D2%B5%CF%DF%0BP%7F%E0%D3%8A%EC%E0%A1%BC%A9SIimzf%10%93%80%22sg%16%93%86%3Ds~yn%83%7B%CB%C8%91We%5C%9C%B8%CA%E1%D0x%CA%BFr%A4%914%95%B1%C5%D7%D4%A6x%A2%B5%E0%E5%E8%C8%B7%84%FC%FD%FE%FE%FE%FD%E8%E0%96%FF%FC%DA%BF%CB%CF%A5%C1%CF%AD%C6%BE%B3%A4G%FA%EF%B9%BE%B0b%E9%EE%F0%2Fm%95%020Q%D8%C6mK%83%A7%A1%BC%CA%1D2%2F%13Jn%23Uri%7Cf%2C%3C4gZ%09%15X%86%1BKo%194B0s%97%1A%60%8F%89z%19%BC%CD%D6%93%B7%D1'a%89%DF%D4%81e%93%A8%086a%C8%D9%E1%AE%A0%40zuN%E6%D6%86%60%8A%9F%88p%1F%BA%C4%A7%14V%7F%B5%98%2C%BA%B6%80%F2%F2%F1%DE%D0%7C%BA%AAT%C4%B6%60%5C%8C%AA%2B%5B%7F%D5%C3w%5D%60DJ%84%A7%85n%17%9F%8E1G%83%A4%B2%9FA2p%96%8F%7F%1D%FF%FF%F2%85%93x%9B%89(%06%3Df%85%AB%BE%94%9Av9o%90ESI%1A%3CY%5C~%88%DA%C8%7Dn_%1F%FD%FD%FDW%8C%AD%90%7C%1B%D4%DC%E2%F0%F3%F2%5Dol%9B%B6%C8%CB%BB_a%94%AF%109O%18Mz%D1%DB%E0%F1%F4%F4F%7C%A1%8Ay%22%5C%93%B4%C3%D3%DE%B9%CC%D7%2B%5B~%FF%FF%FF%2Ci%E4%C9%00%00%00%ACtRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00%05%95%15%B1%00%00%00%DDIDATx%DAbX%8D%06%18%40%84%9EU%9EJ!%AF%08L%20%A8x%F9%A4%DE%CA%F0%F2x%D1%40%88%00%8F%C6%AA%D2%EAH%06%99%A9%ECR%B2%20%01%AE%A5r%EEi96%3D!n%C9%5D%06%E6%40%81%B0*%7DSA%87%88%60%A3%06Wi%BFh%A0%40%A3%A4%BD*%ABfwg%BD%F7D%16%1DK%A0%40%EB%A2%14%25Nu%B3Y%8E%ED5M%D9%1E%40%81%8E~Cg'%85e%7D%25%CD%BE%19%E9%09%40%81%99%8Cs%BD%2C%14%ED%E6%17%F0%8B%17%A9%85%02%05r%AD%A7%04%C8O%AB3%B1%15pa%9AP%0B%14%10%E6%D6%9E%1C%15%E7Y%C6%C1%2C%94%E5%CF%00r%98%18%9Bn%EA%F4%B6%8A%96%D8%98%C53%20~%91%D0%CA_%98%98%99%B4%60%B62%CCsKV%CC3%F6Y9%87%0F%EE%5Bd%00%10%60%00%0E%5Cp%E4%D3%A3%A3%DA%00%00%00%00IEND%AEB%60%82";
Images.health = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%01%FEPLTE%FD%FD%FD%FE%FE%FE%C7%DDn%D1%E4%8A%04%3Bo%04%3Do%BF%DEL%5C%87%98%D3%E3%8A%1F%3EE%D2%E3%8A%0F6L%00Ci%D2%E2%8A)%5E%80)Y%84O%84%A8%E9%F3%AE%DB%EB%81%05Hs%2Cl%94%EB%F4%AF%5E%91%AE%85%AA%BA%08Hy%BC%D5U%B3%D48%C4%DEn%FC%FC%FC%C4%DDp3j%95%E2%EB%9D%8D%B0%C8G%7F%9F%8D%AF%C3%40x%9D%E5%EB%F0%E7%EC%F0%DA%E2%E6(m%98%A7%BDH%03DtB%7C%A0%7B%A1%BB2e%91%FE%FE%FF%25N%5C%BA%C9%D2%AB%C3%D2%CF%E4k%DA%E8%9CJ%7B%91%DC%EA%A3%E3%E9%EE%AE%C4%D3%9C%B0sq%8B3(c%88~%962%22CC%A0%C0%CF%EF%F1%F1%03%3Epb%7F%2C%0B3U%AF%D0%2F1r%98%16S%7C0p%90%AC%C7%1B%BD%CF%DBq%93%911k%90%FC%FD%FE%FD%FE%FE%AD%C0J%40y%A6%B0%C1%AA%D4%E4%A1Rx%83%1CT%82%3Bw%9B%1E%60%8B%17X%87%00Bo%3FZF%EB%EE%EF%E1%E7%E9%00Cn%10Gs%3Ei~%D4%E5%8A%10Q%7F%95%B5%C8%20%5C%86M%83%A5%DA%E9%A4%B3%D332g%8C%B4%CA%D79S%20%C9%DCp6h%93F%7C%A6%E3%EC%F0%0B1%5D%A7%BD%A4%B9%CC%D5%DB%E7%9B%042b%A8%C2%D5%D7%DF%E5%F0%F3%F3%B1%C6%D3o%9A%B1Qk1GfF%BD%CC%D3W%7Bx%C8%D4%A1%94%B3%C7Clz%D2%DD%DE%CD%DB%E2%BB%D2%DD%5E%8D%AB%BA%CCm%F2%F4%F5%5C%80l%EA%F6%B3%BF%DFL%003%60b%91%AE%B9%C8%A7%13T%80%00.W%050W%D8%E9%A0%DA%E8%80%C1%D7jd%91%B0%E0%EF%9Er%9E%B8%F3%F5%F6%C8%D8%AC%FA%FB%FC%A2%BC%CC%1EY%81%1F%5D%8B%BA%D7Q%94%AA%855b%85%BB%D8S%D4%E4%8B%85%AA%BF%D1%DA%E0%E6%F8%AD.q%91%9B%BB%CD%12Q%8E%B2%C0%A4.i%90%DB%EA%A3%22X%7CB%60Y%D7%E4%B4%CF%E1m%D7%EA%9F%005%5E%FF%FF%FF5%C3%B26%00%00%00%AAtRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00%B5%09%C8%D5%00%00%00%DEIDATx%DAbX%89%06%18%40%84i%8D%B8X%91M%15%03T%C0%ABT%C0%25-Ig%A1%B2%99'D%20%5B%3D%80%2F%CEr%0A%FF%E2%B9y%13A%02%19Z%95%0BZ%D9%E7%1Bg%F9%FA%CBU%EB%02%05%E6M%2F%9F%23%B8%D4%7DB%A3%A8_%94%B6-P%20%BEL~%B9%D1%A2%04%93%9C%CE%DEi%1E%FA%40%01%9F%86.f.%8E%E8%99%CC%BCB%E6%93'%01%05%D2%F5%EA%0Ce%99R%99%A4%97u%2F%096%00%0A%D4%AE%08%D5h%9A*9%83%CD%BB%A4%5DQ%0D(P%18%D3%CCi%E1(%95he%9D%AB9%AB%1F(P%D0'%C1%D2Q%ECj%EF%C0%1A%12%18%CE%08r%98j%8F0Of%0A%B7%5D%84%D3l%06%88_T%94D%DA%22%9D%83Z%F2%19a%9E%ABw%8BU%A8H%0E%93%81%FB%16%19%00%04%18%00*%04nF%C9M%B7%E3%00%00%00%00IEND%AEB%60%82";
Images.percent = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%01%F5PLTE%FE%FE%FE%2C%99%0D%E0%EA%EE%E7%ED%F0%FC%FD%FE%E3%E8%E9%001%60%000b%3A%CC%06%A3%BF%D4%0DFu%089%60%3A%CC%05R%8B%ACF%7D%A3G~%A2%0BDo%07Fn1%AD%13-g%8F%04Dm1%AE%15%A4%C1%D5%1Dt%2C%04%40r%05Br1%AA%0B%0FU%7F%15T%7B%13Nv%12N%7D%14S%7F%8C%B2%C6S%8B%AC%13R2%17%5D%88%22x%18%13W7%1DU%7F%1CW%7C%F1%F4%F5%BE%D0%DA%05%40l%006%60%84%AA%BE%AF%C6%D5%18U%83%05Jf%00%1EM%A4%BC%CA%A6%BE%CD%15Hu6o%93%D7%E1%E4%13Iw%2C%99%13%1FW%82o%97%B1%1D%7C31%B2%18S%88%A8%06%3Fg6%BE%0F6p%93*%5C%84%1Df%0D%05%40YK%80%9E%3Bu%99%1EU%7C%0FVI%0ABt%3F%DD%07%96%B6%C9%E9%F0%F3%0A%3EE%07%3Dh%FD%FD%FD%F7%F9%FA%18U%0F%04%3FqV%86%A6%05Dc%C1%D1%DE%04%3Fsa%93%AC%14M%7B%09Dp%00!R%A4%C0%CF%11Er%A4%C0%CE%A3%C1%D5%07Bs%2C%99%0B%11Gs%10Gt%2Fh%8B%00%24Q%1C_%8A1%AA%08%8E%B2%C7%24U~%22w%131i%8DL%84%A6%A3%BF%D3H~%9F%22%8F1%08Eq%17T%865o%94%EC%EE%F10o%95%1Dp'%C9%D9%E1%FA%FB%FC%18S%7B%00%3El%2Ff%90%C6%D3%DA%91%AF%C3%05%3CU%C5%D4%DE%0CGu%22Rz%26e%8E%3A%CD%0Bn%99%B2%12V%80%1Dw-%2Fk%8Fk%99%B1%0AAmv%9F%B8%055R%E8%ED%F0%1CQv%004e1%AA%0Dr%9A%B0%0FUE%14Ks%C8%D6%DE.n%97%F3%F4%F5%00%3Ah%00%3Bi%14Mz%09Es6%BB%07%0FIk%2C%9F%19%0FZLt%9E%B9%1DS%7D%03ItD%EE%04%D2%DE%E3%0FPC6%BE%11%9A%BB%CD1%B0%18%22%86'%01%3Dj%13H%26%FF%FF%FF%E8%1B%F6*%00%00%00%A7tRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00t%D5%D1%A8%00%00%00%DDIDATx%DAbX%86%06%18%40%04SdO%A8e4%13L%80E%8C7_8%B1%DCD1%86%05%22%C0i%EF%3A%BB6%CD%C1%A2%2F%23%AB%04%24%C0%CC%3F%DD%B8w%F1%CC%A9A9%DC%13%8A%19%80%02%0B%D5%E3%DB%E7%A6%DB%19X%5B%C5Ni%F3%02%0A%D8%84%99%A9Nsd4%17%2F%D3%93u%9E%07%14%C8%EC%2Cu%12%92JaT%D2%CFS%AB3%04%0A%F0%09%C8%E5%26%A9%C4%F1t%2F%0AIH6%02%0A%CC%12tg%2F%9A%B1%94%C3_t%92m%B6)P%20X%5E%BBiA%84%B7G%BD%9B%CF%1C%1D%0D%A0%40A%CB%92%F9U%12%01l%5D%5CZ.%AC%20k%9717%88Ln%AD%89%0A%97l%AE%F0%85%F8%A5%A3%B2%B0QZF9P%93%01%E6%B9%89%D5%9E%0A%A9%BA%FD~p%DF%22%03%80%00%03%00%09Ol%02dA%3Ad%00%00%00%00IEND%AEB%60%82";
Images.stamina = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%02%01PLTE%FD%FD%FE%FF%E2%01%03Ex%0DI%7C%1DV%7C%1DW%7F%B4%C9%D32m%96%1DR%8D%B5%CA%D3%15Nx%058m%0BEp%B9%CA%D2%25%5E%84M%84%A6%01%3Aq%FF%DB%01%F2%F4%F4%07G%7B%9E%BA%CA%17T%80%FB%FC%F6%F3%F3%F2%D1%DB%E0%EE%F2%F31q%9B%FF%FF%FFUh%89%FF%C7%00'Z%94%A7%88Q%1AQ%82%FF%DE%00%1AY%9A%99lD%F1%F5%F8%95nK%FD%DF%04%AA%C3%CF%FF%DD%02%5C_%94%E8%EE%F0%B2%C7%D3c%92%AE!%60%8B%B9%CF%DF%B9%94K%94%AD%C1%FF%DD%18%FB%FC%FC%FF%D6%1E%BE%D2%DCTEI%15Rx%CA%D6%DC%FF%EA%00%5DfnBEZ%9B%84_%AC%C4%D3%D2%DD%E2%13U%8D%8C%AE%C08a%8B%EC%A5%13%FC%DDA0T%7Ce%99%B4%25Fkn%97%B3%B8%91A%1C%60%9C%C5%7FI%E4%E8%E9%EA%B8*~%A4%B3%DA%AA%25%98r%5D%FC%FC%FB%0EQ%80%FF%E1%8BH%82%9EHm%99%FC%FE%FD%E5%AD%22%12O%7B%10Mu%EC%B0'%0EH%7C%B8%CA%D1%00Gx%0DEv7s%9C%1BQ%7CO%86%A5%FE%FE%FE%17Mv.q%97%EA%EF%F0%1DU%80%FD%DC%01Ri%82%A6%8DT%99%B7%C9%19X%89%02Ao%D6%962%18V%85%98d%2B%5B%8B%A7%8F%7Cit%9D%B9L%85%AD%C5%D1%D5%D7%9AB%FF%C9%04Pn~%E0%E9%EE%ED%B2%16k%9A%B7-j%8D%2CN%86n%5D%5E%81%A5%B86n%95%90g%3A%97%AA%BB%03%3Dl%FE%DF%0A%1FY%867o%97%FC%E9P!%5C%86%FC%D5%00-r%9A%DC%92%10%12T%92%FB%DFM%FF%DD%00N%88%AA%A0%C1%D2%E7%EC%EB%E4%A2%1F%A0%C0%CFdh%7D%FD%D5%5D%E5%B6%23%E7%ED%F0%E5%EB%ED%C7%D7%E1%FF%D8%04%0A6_%11Lv%FE%FE%FF%FF%D9%006Z%86f%96%B4%FD%FD%FD%F7%D4%AF%0EGo%FE%F1%92%20%5E%92CPa%17%5D%89P%87%A90m%96%FF%F9%C22q%935Mw%FF%FF%FFk%B2_%FF%00%00%00%ABtRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00%B7*%3Dl%00%00%00%DDIDATx%DAbX%85%06%18%40%C4T%BD%1A%1D%B7%09e0%01%06%DE%F8%DA%CA%D2%FC%E0%1E%1B%06%88%00g%3B%0B%DF%A29%D9%F29%2B%B4%8D%40%02%7DA%0B%14%9A%26jN%F6%AD%8Al%B6%9D%05%14%F0%11%E5%B2K%8B%F0ft%E70%0B%2FH%06%0A%2C%9D%C9%AAd%ADh%A1Q%2C%93%99%C8%1E%05%14(%8Ck%F5H%EFnT%9B%AE%2F%97%A2%2B%02%14%E0%E7%09%EB%F43nIe%0Cu%8EY%A2%0E%14%C8%CB%12%B6%F4%9C%B4%B0M%B0%7CeCR%11P%80-%40%40U%B6K%CCiv%BFk%B4%BD8P%40%A8%82%C9%CA%D10dyI%1Dw%AC%974%C8aZs%99M%3B%02%E7%E7%CE%902%9F%07%F1%CB%94%DEe%8B%95%AB%1D%5C%24%12%60%9ES%99%96Qo%60%22%E9%0F%F7-2%00%080%00syo%E7h%19%818%00%00%00%00IEND%AEB%60%82";
Images.lock = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%06PLTE%00%00%00%00%00%00%A5g%B9%CF%00%00%00%01tRNS%00%40%E6%D8f%00%00%00%0FIDATx%DAb%60%18%05%C8%00%20%C0%00%01%10%00%01%3BBBK%00%00%00%00IEND%AEB%60%82";
Images.play = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%0FPLTE%A7%A7%A7%C8%C8%C8YYY%40%40%40%00%00%00%9F0%E7%C0%00%00%00%05tRNS%FF%FF%FF%FF%00%FB%B6%0ES%00%00%00%2BIDATx%DAb%60A%03%0CT%13%60fbD%13%60%86%0B%C1%05%60BH%02%CC%CC%0CxU%A0%99%81n%0BeN%07%080%00%03%EF%03%C6%E9%D4%E3)%00%00%00%00IEND%AEB%60%82";
Images.pause = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%06PLTE%40%40%40%00%00%00i%D8%B3%D7%00%00%00%02tRNS%FF%00%E5%B70J%00%00%00%1AIDATx%DAb%60D%03%0CT%13%60%60%80%60%3A%0BP%E6t%80%00%03%00%7B%1E%00%E5E%89X%9D%00%00%00%00IEND%AEB%60%82";
Images.star_off = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%0C%00%00%00%0C%08%03%00%00%00a%AB%AC%D5%00%00%00%96PLTE%E7%E8%E9%E7%E8%EA%F2%F3%F4%E4%E5%E6%DF%E0%E1%E1%E2%E3%DA%DB%DC%D2%D3%D4%D3%D4%D5%DE%DF%E0%F1%F2%F3%E8%E9%EB%D8%D9%DA%EF%F1%F2%EE%F0%F2%EB%ED%EF%EB%ED%EE%EA%EC%EE%F1%F3%F4%DF%E1%E1%E4%E6%E7%DB%DD%DD%E3%E4%E6%DA%DC%DD%EA%EB%ED%F0%F1%F2%E3%E4%E5%E2%E3%E4%EC%ED%EE%F5%F6%F8%F2%F3%F5%EC%EE%EF%DC%DE%DF%E4%E5%E7%EF%F0%F2%EA%EB%EC%F4%F5%F7%E7%E9%EA%F6%F7%F9%E6%E8%E9%DB%DD%DE%F3%F4%F6%EC%EE%EE%E0%E1%E2%ED%EE%EF%D4%D5%D6%F4%F5%F6%D5%D6%D7%F5%F6%F7%FF%FF%FFmf%FB%E3%00%00%002tRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00%0DP%98%EF%00%00%00vIDATx%DA%3C%8D%D9%16%820%0CD%C3NE%C5%05%10%DC%C0%05%94ni%FF%FF%E7%A0%C1%E3%7D%C8%E4%BE%CC%80ux%1E%05%B8%F3Vj%FC%CBC%88j%91%DB%B3%C6f%85%99%BC%0F%20%D25%03c%5Ea%9C%96%B0Ci%08%89%1C%2C%C7%EB%EFw%05%7D%ACgXAm%9FP%FB%BE%3E_H%A2%20P*%82%2F%C9)%E96%87c%82%24y%EB%06%B7%7Bk'%01%06%00%92%E5%14%B02%9F%07%C0%00%00%00%00IEND%AEB%60%82";
Images.star_on = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%0C%00%00%00%0C%08%03%00%00%00a%AB%AC%D5%00%00%00%FCPLTE%FF%ECx%EC%E5%D8%C2%956%DB%C3%8F%C4%968%C3%96%3A%F6%E2w%E5%D7%BB%C9%9D%3B%C2%959%CC%A5U%D3%B6w%EA%E3%D3%EE%E7%DA%FD%EA%5D%EA%E0%CC%FE%EFc%DC%B6A%FF%E3K%C2%937%C5%9A%3A%D7%BD%85%FE%F3%95%E1%BA%3B%E9%E0%CB%E0%BDH%EF%D6l%EF%E9%DF%E7%CCd%E8%DF%C9%F4%DFq%D6%AC%3C%CD%A2%3D%FF%F1%8A%E3%C6%60%D8%BE%88%F5%F5%F5%D0%B0k%F2%F2%EE%FF%E2P%EB%CEN%EE%C8%3C%EF%EC%E3%C3%957%C4%98%3A%EC%E4%D4%CA%A3S%DD%C6%9B%EC%D3k%E0%CF%AB%FF%EE%60%D6%BA%80%DA%BF%87%F1%F0%EB%EA%E1%CF%CF%AA%5D%FF%E5O%E2%D1%AF%FA%E9%83%F5%DDj%E7%C3%40%E8%C5C%C4%959%ED%D3i%E4%D7%BC%F2%EF%E7%C4%977%FB%EC%87%E0%C1_%FF%EF%80%FF%F5%99%C2%969%DC%C8%9F%C5%978%F3%F0%EC%D9%C1%90%DA%C4%94%D3%B4t%BF%8E.%C5%997%FF%EC%5C%FF%DEB%FF%F7%A0%FF%FF%FFv%E6%2F%B2%00%00%00TtRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00S%F7r%D1%00%00%00%83IDATx%DAb%08%06%01f%130%C5%00%22%1C%99%3C%A5%E1%1Ce%19%7B_0G%85%97%5D%9FE%CCM%C4%DB%92%DF%8BA%D5%DF%C5%C0*(%C8YJ%89C%8F%C1%CC%8E-((H%D1%95%C1ZG%96!X%97U%8EA%3D0PS%5B%02d%80%83B%A0%90E%A0%BC%07%D84C%C1%00%01%3E%23%5Bc0GT%5C%C3%C9%5D%D2%86%0B%CC1%F7%E3%D6R%F3%11%E6%04s%18%19A%16%9A%F2%04%07%03%04%18%001%8C%20dI%CC%B1%85%00%00%00%00IEND%AEB%60%82";
Images.timer = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%0C%00%00%00%0C%08%03%00%00%00a%AB%AC%D5%00%00%00%06PLTE%22%22%22%FF%FF%FF%5E%87%201%00%00%00%02tRNS%FF%00%E5%B70J%00%00%00'IDATx%DAb%60D%02%0C%E8%1C%06%08%00s%C0%0C%08A%12%07%CC%83s%40%3C%04%07*%83b%0F%02%00%04%18%00%18%EF%00Jb%DAw%FF%00%00%00%00IEND%AEB%60%82";
Images.timer_red = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%0C%00%00%00%0C%08%03%00%00%00a%AB%AC%D5%00%00%00%06PLTE%CD%0A%0A%FF%FF%FF-%A2jr%00%00%00%02tRNS%FF%00%E5%B70J%00%00%00(IDATx%DAb%60D%02%0C%40%04%01%60%0E%98%01%E1%91%C4%01%93p%0E%88Bp%A02(%F6%A0%BA%00%01%00%02%0C%00%15%0D%00J%D9%85%06%E0%00%00%00%00IEND%AEB%60%82";
Images.potion_energy = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%01qPLTE%E4%E1%DE%0D%7B%FFM%94%FF%C4%D3%E1%EC%EC%EE%FB%FB%FA%02%99%FFQVa%00%9B%FC)r%FF%F7%F6%F6)p%FF%E9%EC%FF%FB%FA%FAttt%D4%E0%EB%00%7D%FF3%8D%E3%FA%F9%F9%07%7F%FD%20j%FF%5E%A2%D6DMR%AE%A3%9D%07Hr%3A%9A%ED%17%9E%E7q%93%C9%81%B7%D9%D7%E0%EB%F1%F1%F3%15i%FF%07%8F%FE%A4%C8%DDk%9C%CC%9A%B1%FF%F0%F0%F0%0D%98%DC%80~%7C%08%7C%FF%90%83r%5C%9C%CA%F3%F2%F0D%92%D2%06%95%FC%D1%CF%D9%0E%87%F9o%C9%F9%FD%FC%FC%9E%A0%A3%F5%F9%FD%C7%C0%B8d%60a%5D%84%AA%A1%B8%DDA%7F%CE%A0%A6%C3a%98%FEGHH%86%A2%BE%00%8F%FA%F5%F4%F2%F5%F5%F7%A8%A4%A2v%9D%FF%0Cz%FF%2Bs%FF%FA%FA%FA%00%B2%F8%02%96%FF%E7%EA%FFwwx%1D%94%E8%00%8E%FF*j%FF%AD%A3%96)%B1%F1%5D%BB%ED%0B%2Cl%F2%F1%F2%A1%90~r%AD%CAW%83%FF-%A1%F8%5D%A8%FA%BB%D0%E6%26%87%FC%D9%D4%CE%22%A8%F9e%8A%FF%12%9E%FF%05u%FF%19g%FF%13m%FFeq%87%20p%FF%03l%FFtfZ%3E%9E%E3%9C%C6%DF9w%FF)%C0%F4%17r%FF%D1%D2%DB%1Ey%B5%D4%E6%F9%00%85%FF%0Ep%FF%F4%F3%F1%8E%8E%91%23s%FF%0Do%FFY%BD%E4%8C%7Cl%BA%C8%FFG%86%FF%23%A0%EC%EC%ED%ED%20%BE%FF%00%8D%D24%8E%FF%00I%8A%FF%FF%FFC%9B%AE%8C%00%00%00%7BtRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00%93%C3%A8%EA%00%00%00%AAIDATx%DAb%A8%02%01%5E3si%7F0%AB%8A%01L%A6%FBITZ%20%0B%B0%B0%8B%C5%E9%22%0B%E4%F0%99%D83%20%0Bh%E5Z%A9%A1%08p%05f(%95%22%0B%08%15%B8%F8%A8%20%0B0%A7rD%24%3B%23%04B%F5%CB%D2%C2TeXa%02%FC!%15%0A%96L%C2%E5%8AP%01%03_%B6%84b%B7%A2%3C%1B)9%88%80Qp%96%7C%24%8F%B2%97%A3N%26D%C0NR%20%26%C8!%25%3E_O%16%22%10%60%EA%AA%EE%C4%C9-%E2%A9%5D%08%11%F0N%D4%8C%8A%8Ee%CC%16t%D7%80%DA%12.n%9D%E4Q%22jhl%0B%E4%00%04%18%00aI%5C8%B90%1DA%00%00%00%00IEND%AEB%60%82";
Images.potion_stamina = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%01tPLTE%FD%B0Q%FD%FB%F7%FD%FB%F6%FA%60%24%FA%F5%EC%FE%FA%E9%F5%DA%BB%F4%D8%BB%FD%B0R%EE%E5%D7%EC%E1%C9%FA%F8%F3%ED%E7%D8%FB%F8%F1%7B%80%83%F9%95I%FB%F4%E9%FD%FC%F8%FE%FE%FB%F2kG%FFu%2C%FD%97%3B%E9g6%FF%7C)%E8%83X%FE%90%3A%FF%8D0%91%8D%88%FA%7F7%FC%5D%40%F7%9E%84%D4%95%80%88%7Fd%F8%F1%E5%DB%8BS%CF%AD%90%804%1E%FE%861%DDP4%FB%E8%D9%D8%C6%9E%E7%8BT%FE%D0%8D%F7bG%B0%A4%94%FCq.%FD%D2%81%F6%F4%F2%FDm%22%F0%BC%98%F7%F0%E5%FFh(%FE%9E%40%F0%86g%D6%3F!%FF%ABL%FD%BEj%BC%5BC%FF%9E%3C%E6%AC%8A%A3%9A%87%A8%A3%9B%F3%E4%D5%FD%B0P%FA%F5%ED%FE%FB%E8%F9b%23%F3%90V%F6j%3D%F9%F5%EC%F9E%13%F4%89d%FD%A8J%94%91%91jhl%FE%8D7%FE%AEH%FFr8%96*%0E%FD%A8DwY0%97%83x%95%8Fx%B0%B4%B5%FC%C9t%FC%A5%40%CC%C6%BDmcb%FD%C1%7D%FE%EE%C6%BD%B4%A4%DC%D6%D0%D9%AAy%95%89w%F8%A9x%EAU-%EA%E2%C9%D4%9F%81%F0m%40%F8~G%D4%8Fl%DF%8D%5E%FD%8E.%E9%CB%A6%BD%AE%98%FD%B1k%FE%E5%AB%ED%BD%A0%FD%BB%5E%FE%FA%F7%F3%26%0F%E0%97p%FA%F6%EB%FD%B7Q%FC%5B%23%9E%8Cn%FD%FC%F7%FE%999%F9%7C%2F%7Csf%C1%91i%FD%95M%F8%E2%CC%FF%FF%FFgb%E8%EA%00%00%00%7CtRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00%01j%DA1%00%00%00%ABIDATx%DAb%A8%06%01%C6t%A5%18%160%AB%9A%01Lr%05%A8%F8i%20%0B(%96%87%07%26%20%0B8H%F3%05s%22%0B%B8%DAzy%F2%20%0B%F0%CA%5B%26%1A!%0B0%99%E6%09%0B%20%0B%B0i%BB%B9%18%96%20%04%D8%E5dM%F8%D5%AC%05a%02Uq%95%BA%11%99ef%D9P%01!%F7%A24%0B%C7Hs%A7%F8%02%88%40n%B2A%A8%1EkV%A17%B3%3AD%80%DBY%DC%3FD%2B%C7%A3T%C6%0E%22%60Sa%AC%CA%C1%60%EF%23%92%1A%04%11%D0QH%F1%95%B2%92%14%D5%2C%8E%85%DA%12%1D%A5%2C!%96%94%9F%11%A6%0F%E4%00%04%18%00%BA%F5%5D7%DF%1B%AE%5B%00%00%00%00IEND%AEB%60%82";
Images.beta = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%06PLTE%FF%FF%FFiii%92%95*%C3%00%00%00%01tRNS%00%40%E6%D8f%00%00%003IDATx%DAb%60%C0%00%8C%8C%E8%02%0C%8CD%A8%60D%16%05%B1%19%890%98%01%5D%1BV%7DX%04%181%EDG%B7%8C%91%90%2F0%0Df%60%00%080%00%15*%00%26%C7%CF%D9%E5%00%00%00%00IEND%AEB%60%82";
Images.update = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%18PLTE%C7%C7%C7UUU%7B%7B%7B%BF%BF%BF%A6%A6%A6%FF%FF%FF%40%40%40%FF%FF%FFk5%D0%FB%00%00%00%08tRNS%FF%FF%FF%FF%FF%FF%FF%00%DE%83%BDY%00%00%00UIDATx%DAt%8F%5B%12%800%08%03%23%8Fx%FF%1B%5B%C0%96%EA%E8~%95%9D%C0%A48_%E0S%A8p%20%3A%85%F1%C6Jh%3C%DD%FD%205E%E4%3D%18%5B)*%9E%82-%24W6Q%F3Cp%09%E1%A2%8E%A2%13%E8b)lVGU%C7%FF%E7v.%01%06%005%D6%06%07%F9%3B(%D0%00%00%00%00IEND%AEB%60%82";
Images.options = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%0FPLTE%E2%E2%E2%8A%8A%8A%AC%AC%AC%FF%FF%FFUUU%1C%CB%CE%D3%00%00%00%04tRNS%FF%FF%FF%00%40*%A9%F4%00%00%00%3DIDATx%DA%A4%8FA%0E%00%40%04%03%A9%FE%FF%CDK%D2%B0%BBW%BD%CD%94%08%8B%2F%B6%10N%BE%A2%18%97%00%09pDr%A5%85%B8W%8A%911%09%A8%EC%2B%8CaM%60%F5%CB%11%60%00%9C%F0%03%07%F6%BC%1D%2C%00%00%00%00IEND%AEB%60%82";
Images.arena = "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%02jPLTE%B5v4%FF%EF%CA%F2%EA%E0%FF%E3%AA%D6%B8%98%B4v5%FA%F4%EF%FC%F7%F4%FD%B5M%FF%EB%D5%FC%CE%8D%EF%A7e%F4%9CJ%F6%9CI%FD%D5%A3%FF%F9%EC%FB%F7%F3%F9%B4c%EC%BD%91%FA%CF%98%B7%80A%FE%CEn%D9%C1%A9%F6%A2R%E6%D5%C3%D0%93R%E9%8D3%D2%A9x%FC%C5%92%FE%D7%A6%FC%D6%A5%E9%C1%8F%FD%D7%A7%D7%BB%9B%D7%A2h%F1%94%3D%ED%91%3E%F8%EF%E2%F7%B4n%D0%95U%FF%F7%D8%F2%B5l%F1%AA%5C%F2%AE%5D%FF%F9%EA%FA%C1~%D8%A1c%DC%BF%9D%FF%F5%D7%CC%90O%F8%F3%EE%FB%E3%C5%F4%EA%DF%CE%9Ee%F7%CA%95%DB%BF%A1%D8%B2%82%FB%C8%86%F6%DA%BF%FE%E6%C8%FF%D4%99%F9%C9%8F%D4%884%C9%9Fn%D2%87%3A%F0%E5%DA%DB%97%40%FF%BAP%F1%B5q%DF%C5%A7%BA%82C%F7%98C%C6%85%3E%FF%D9%A3%C5%836%F9%D0%A1%BBq%20%EC%DF%D0%C0%90%5C%FE%EE%D8%FB%D6%A7%F3%C1%8E%CC%8EC%FE%E2%C1%F5%C2v%E9%B4v%F5%DA%C2%F9%A0I%FA%C7%84%E3%A5_%DC%ACv%F9%D2%AC%D1%A7w%F8%B8i%B5%7CA%F1%AEn%FD%FB%F9%F9%B9_%F8%A5T%EC%9CH%E2%CC%B4%E9%95B%C2%8ER%FF%E4%AA%FA%CB%94%E1%93D%F9%F5%EF%F6%F0%E9%FF%FA%F0%EE%8D5%F8%B7l%FF%ED%C2%E7%D6%C1%FC%D5%A1%D5%B0%83%F5%D8%C0%EC%98C%F3%E9%E2%F3%9AK%E8%B5z%F7%A6S%FB%ED%E2%FF%F3%D9%EE%908%F6%CE%A0%EB%ACu%ED%B9z%EC%BC%8E%ED%B9%87%F3%EA%E4%FF%E7%B8%FA%C7%7F%F8%E1%C8%F1%E7%DD%E9%DA%CA%FF%DE%8F%F2%B5%7D%DC%C0%A1%F9%F2%E9%D2%95E%EE%E2%D5%FE%DD%B6%FE%DC%A8%FA%D5%A2%C1%88J%FE%E7%C4%FF%C5b%C0%84E%EE%A2Z%F4%C6%96%FC%B4M%D5%BB%A0%E1%A7W%D0%AF%8A%F8%B0%5B%FF%CDm%EF%A9e%BE%81%3E%F8%B7i%ED%E0%D1%D6%B1%87%DC%C3%A8%FD%CC%87%C0z%2B%EE%B5%7D%F3%E6%D5%FE%DB%B0%EF%C6%95%ED%C7%9D%FD%DF%B8%BDs%26%FF%E9%B8%C8%85%3A%FA%D8%B0%F3%A6X%BE%82%3D%F3%C7%9C%FF%D4p%FA%E0%C2%E4%D0%BB%FB%C5%8A%F1%E6%D9%D0%A9%7C%FD%D9%91%F4%AD%5D%D7%94A%FB%CB%8B%DC%8A7%FC%F2%E4%FF%E3%B4%F9%D3%B0%EF%DA%BD%F2%EA%E1%E7%9A%40%F0%B5%80%F1%A7Y%DA%C1%A4%FE%FE%FD%FF%D8%7F%FF%F9%F0%CD%827%FF%D5%8D%CC%A5%7C%F1%BB%8C%FF%FF%FF%FF%FF%FF4%D1%F7(%00%00%00%CEtRNS%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%FF%00U%06%A1l%00%00%01%07IDATx%DAb8%0B%02Fm%E6%9D%9B%B3%C1L%06%20%CE%3A5A%AF%3C4R2%C6%11%22%C0%94%16%C5%98%BF%B7%CF%D3%C6%C5C%02%24%C0%16'%AF%A1s%DC%AA%DE%3A%60Q%DE%9A%AD%40%01%7B%25%83%9C3gN%ABl%0A%CE%10%3Cl%9A%C0p%80%A1%BF%EA%CC%19%F6Ce%81%CB%E4%D4%92%1CZ%19%C4%267%F1%9F9S%BCOf%CAJY%DD%8ALW%06%16%F5%D5%7BJ%1Bk%85%1ArW%2C%D7%14O%5E%C0%A0o%98%EE_%19%D6%B1a*%CF%1C%E1X%DE%D4m%0C%FB%E7%9E%9C%C8%B9%24%BA%C5xKu%C4%3C%F7%DD%0B%19T%D7%870%AF%E5%EE%AD%F1VP%D6%9E%15~b%3E%C3Y%8B%A0%F6%BAx%3E3%DB%C2uRZ%25%D2G%19%CEv%B9%CD8%B6%9Dk%97es%E2%B4%1D%8B%7DAN_*%D2-%BAq%F6%24g%8E%83%3EG%20%9E%13(b%F5%DA%E9d%B7%CA%AF%00%EA%DB%B3gMR%A6%CFT%EC%013%01%02%0C%00%7F%BAz%81%3F%91%3Et%00%00%00%00IEND%AEB%60%82";

var makeImage = function(type, title) {
	return '<img class="g_image g_' + type + '" title="' + (typeof title !== 'undefined' ? title : ucfirst(type)) + '" src="' + Images.blank + '">';
};

function do_css(){
$('head').append("<style type=\"text/css\">\
.red { background: #ffd3d3 !important; }\
.red:hover { background: #ffc0c0 !important; }\
.green { background: #e6ffe6 !important; }\
.green:hover { background: #d3ffd3 !important; }\
.golem-tooltip { display: none; position: absolute; top: 10000px; left: 10000px; min-width: 250px; z-index: 5; margin: 0; padding: 0; }\
.golem-tooltip > p { background: white; border: 1px solid #aaaaaa; margin: 0; padding: 5px; }\
.golem-tooltip > a { float: right; color: red; }\
.golem-config { position: static; width: 190px; padding: 4px; margin-bottom: 17px; overflow: hidden; overflow-y: auto; float: right; z-index: 10; }\
.golem-config > div { margin-top: 4px; }\
.golem_config h3 { -webkit-user-select: none; -moz-user-select: none; }\
.golem-config #golem_fixed { float:right; margin:-2px; width:16px; height: 16px; background: url('data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%0FPLTE%DE%DE%DE%DD%DD%DDcccUUU%00%00%00%23%06%7B1%00%00%00%05tRNS%FF%FF%FF%FF%00%FB%B6%0ES%00%00%00.IDATx%DAb%60A%03%0Cd%0B03%81%18LH%02%10%80%2C%C0%84%24%00%96d%C2%A7%02%AB%19L%8C%A8%B6P%C3%E9%08%00%10%60%00%00z%03%C7%24%170%91%00%00%00%00IEND%AEB%60%82') no-repeat; }\
.golem-config-fixed { position: fixed; margin-left: 760px; }\
.golem-config-fixed #golem_fixed { background: url('data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%0FPLTE%DE%DE%DE%DD%DD%DDcccUUU%00%00%00%23%06%7B1%00%00%00%05tRNS%FF%FF%FF%FF%00%FB%B6%0ES%00%00%005IDATx%DAb%60A%03%0C%C4%0901%83%00%13%92%0A%B0%00%0B)%02%8C%CCLLL%CC%0Cx%0CefF%E8%81%B9%83%19%DDa%84%05H%F0%1C%40%80%01%00%FE9%03%C7%D4%8CU%A3%00%00%00%00IEND%AEB%60%82') no-repeat; }\
#golem-dashboard { position: absolute; width: 600px; height: 185px; margin: 0; border-left: 1px solid black; border-right:1px solid black; overflow: hidden; background: white; z-index: 3; }\
#golem-dashboard thead th { cursor: pointer }\
#golem-dashboard thead th.golem-sort:after { content: '&darr;'; }\
#golem-dashboard thead th.golem-sort-reverse:after { content: '&uarr;'; }\
#golem-dashboard tbody tr:nth-child(odd) { background: #eeeeee; }\
#golem-dashboard tbody th { text-align: left; font-weight: normal; }\
#golem-dashboard td, #golem-dashboard th { margin: 2px; text-align: center; padding: 0 8px; }\
#golem-dashboard > div { height: 163px; overflow: hidden; overflow-y: scroll; border-top: 1px solid #d3d3d3; }\
#golem-dashboard > div > div { padding: 2px; }\
#golem-dashboard .golem-status { width: 100%; }\
#golem-dashboard .golem-status tbody th { text-align: right; padding: 2px; font-weight: bold; }\
#golem-dashboard .golem-status tbody td { text-align: left; }\
#golem-dashboard .overlay { position: absolute; left:10px; margin: 3px; color: white; text-shadow: black 0px 0px 2px; }\
table.golem-graph { height: 100px }\
table.golem-graph tbody th, table.golem-graph tbody td { border-top: 1px solid #dddddd; border-bottom: 1px solid #dddddd; }\
table.golem-graph tbody th { max-width: 75px; }\
table.golem-graph tbody th:first-child { text-align: right; border-left: 1px solid #dddddd; border-right: 1px solid #cccccc; }\
table.golem-graph tbody th:first-child div { line-height: 60px; height: 60px; }\
table.golem-graph tbody th:first-child div:first-child, table.golem-graph tbody th:first-child div:last-child { line-height: 20px; height: 20px; }\
table.golem-graph tbody th:last-child { text-align: left; border-right: 1px solid #dddddd; vertical-align: bottom; }\
table.golem-graph tbody th:last-child div { position: relative; height: 10px; margin: -10px 0 0; }\
table.golem-graph tbody th:last-child div:nth-last-child(1) { color: #ff0000; }\
table.golem-graph tbody th:last-child div:nth-last-child(2) { color: #0000ff; }\
table.golem-graph tbody th:last-child div:nth-last-child(3) { color: #00ffff; }\
table.golem-graph tbody th:last-child div:nth-last-child(4) { color: #aa00aa; }\
table.golem-graph tbody td { margin: 0; padding: 0 !important; vertical-align: bottom; width: 5px; border-right: 1px solid #dddddd; }\
table.golem-graph tbody td:nth-child(12n+1) { border-right: 1px solid #cccccc; }\
table.golem-graph tbody td div div { margin: 0; padding: 0; width: 5px; }\
table.golem-graph tbody td div.bars div:nth-last-child(1) { background: #00ff00; }\
table.golem-graph tbody td div.bars div:nth-last-child(2) { background: #00aa00; }\
table.golem-graph tbody td div.bars div:nth-last-child(3) { background: #ffff00; }\
table.golem-graph tbody td div.bars div:nth-last-child(4) { background: #ff00ff; }\
table.golem-graph tbody td div.goal div { position: relative; height: 1px; margin: -1px 0 0; }\
table.golem-graph tbody td div.goal div:nth-last-child(1) { background: #ff0000; }\
table.golem-graph tbody td div.goal div:nth-last-child(2) { background: #0000ff; }\
table.golem-graph tbody td div.goal div:nth-last-child(3) { background: #00ffff; }\
table.golem-graph tbody td div.goal div:nth-last-child(4) { background: #aa00aa; }\
.golem-button, .golem-button-active { border: 1px solid #d3d3d3; background: #e6e6e6 url(http://cloutman.com/css/base/images/ui-bg_glass_75_e6e6e6_1x400.png) 50% 50% repeat-x; display: inline-block; cursor: pointer; margin-left: 1px; margin-right: 1px; font-weight: normal; font-size: 13px; color: #555555; padding: 2px 2px 2px 2px; -moz-border-radius: 3px; -webkit-border-radius: 3px; border-radius: 3px; }\
.golem-button:hover, .golem-button-active { border: 1px solid #aaaaaa; background: #dadada url(http://cloutman.com/css/base/images/ui-bg_glass_75_dadada_1x400.png) 50% 50% repeat-x; }\
img.golem-button, img.golem-button-active { margin-bottom: -2px }\
.golem-tab-header { position: relative; top: 1px; border: 1px solid #d3d3d3; display: inline-block; cursor: pointer; margin-left: 1px; margin-right: 1px; background: #e6e6e6 url(http://cloutman.com/css/base/images/ui-bg_glass_75_e6e6e6_1x400.png) 50% 50% repeat-x; font-weight: normal; color: #555555; padding: 2px 2px 1px 2px; -moz-border-radius-topleft: 3px; -webkit-border-top-left-radius: 3px; border-top-left-radius: 3px; -moz-border-radius-topright: 3px; -webkit-border-top-right-radius: 3px; border-top-right-radius: 3px; }\
.golem-tab-header-active { border: 1px solid #aaaaaa; border-bottom: 0 !important; padding: 2px; background: #dadada url(http://cloutman.com/css/base/images/ui-bg_glass_75_dadada_1x400.png) 50% 50% repeat-x; }\
.golem-title { padding: 4px; margin: -4px -4px 0 -4px !important; overflow: hidden; border-bottom: 1px solid #aaaaaa; background: #cccccc url(http://cloutman.com/css/base/images/ui-bg_highlight-soft_75_cccccc_1x100.png) 50% 50% repeat-x; color: #222222; font-weight: bold; }\
.golem-panel > .golem-panel-header, .golem-panel > * > .golem-panel-header { border: 1px solid #d3d3d3; cursor: pointer; margin-top: 1px; width: 184px; background: #e6e6e6 url(http://cloutman.com/css/base/images/ui-bg_glass_75_e6e6e6_1x400.png) 50% 50% repeat-x; font-weight: normal; color: #555555; padding: 2px 2px 2px 2px; -moz-border-radius: 3px; -webkit-border-radius: 3px; border-radius: 3px; }\
.golem-panel-header input { float: right; margin: 2px; }\
.golem-panel > .golem-panel-content, .golem-panel > * > .golem-panel-content { border: 1px solid #aaaaaa; border-top: 0 !important; padding: 2px 6px; background: #ffffff url(http://cloutman.com/css/base/images/ui-bg_glass_65_ffffff_1x400.png) 50% 50% repeat-x; font-weight: normal; color: #212121; display: none; -moz-border-radius-bottomleft: 3px; -webkit-border-bottom-left-radius: 3px; border-bottom-left-radius: 3px; -moz-border-radius-bottomright: 3px; -webkit-border-bottom-right-radius: 3px; border-bottom-right-radius: 3px; }\
.golem-panel-show > .golem-panel-header, .golem-panel-show > * > .golem-panel-header { border: 1px solid #aaaaaa; border-bottom: 0 !important; background: #dadada url(http://cloutman.com/css/base/images/ui-bg_glass_75_dadada_1x400.png) 50% 50% repeat-x; -moz-border-radius-bottomleft: 0 !important; -webkit-border-bottom-left-radius: 0 !important; border-bottom-left-radius: 0 !important; -moz-border-radius-bottomright: 0 !important; -webkit-border-bottom-right-radius: 0 !important; border-bottom-right-radius: 0 !important; }\
.golem-panel-show > .golem-panel-content, .golem-panel-show > * > .golem-panel-content { display: block; }\
.golem-panel-sortable .golem-lock { display: none; }\
.golem-panel-content br:last-child { clear: both; }\
.golem-panel .golem-panel-header .golem-icon { float: left; width: 16px; height: 16px; background: url('data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%06PLTEUUU%00%00%00%F5%04%9F%A0%00%00%00%02tRNS%FF%00%E5%B70J%00%00%00%22IDATx%DAb%60D%03%0C%D4%13%60%C0%10%60%C0%10%60%C0%10%60%20%A4%82%90-%149%1D%20%C0%00%81%0E%00%F1%DE%25%95%BE%00%00%00%00IEND%AEB%60%82') no-repeat; }\
.golem-panel .golem-panel-header .golem-lock { float: right; width: 16px; height: 16px; background: url('data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%06PLTEUUU%00%00%00%F5%04%9F%A0%00%00%00%02tRNS%FF%00%E5%B70J%00%00%001IDATx%DAb%60D%03%0CD%0B000%A0%0800%C0D%E0%02%8C(%02%0C%0Cp%25%B8%05%18%09%0A%A0j%C1%B4%96%1C%BF%C0%01%40%80%01%00n%11%00%CF%7D%2Bk%9B%00%00%00%00IEND%AEB%60%82') no-repeat;}\
.golem-panel-show .golem-panel-header .golem-icon { float: left; width: 16px; height: 16px; background: url('data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%03%00%00%00(-%0FS%00%00%00%06PLTEUUU%00%00%00%F5%04%9F%A0%00%00%00%02tRNS%FF%00%E5%B70J%00%00%00%22IDATx%DAb%60D%03%0C4%13%60%80%00%24%15%08%3EL%0B%9C%CF%88N%D3%D0a%C8%00%20%C0%00%7F%DE%00%F1%CCc%A6b%00%00%00%00IEND%AEB%60%82') no-repeat; }\
.golem-info { text-align: center; display: block; }\
img.g_image { width: 16px; height: 16px; margin-bottom: -4px; }\
img.g_arena { background: url(\""+Images.arena+"\") no-repeat; }\
img.g_energy { background: url(\""+Images.energy+"\") no-repeat; }\
img.g_exp { background: url(\""+Images.exp+"\") no-repeat; }\
img.g_gold { background: url(\""+Images.gold+"\") no-repeat; }\
img.g_health { background: url(\""+Images.health+"\") no-repeat; }\
img.g_percent { background: url(\""+Images.percent+"\") no-repeat; }\
img.g_stamina { background: url(\""+Images.stamina+"\") no-repeat; }\
img.g_potion_stamina { background: url(\""+Images.potion_stamina+"\") no-repeat; }\
img.g_potion_energy { background: url(\""+Images.potion_energy+"\") no-repeat; }\
</style>");
}
/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isGreasemonkey, GM_setValue, GM_getValue, localStorage, window,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH
	Workers, makeImage
*/
// Utility functions

// Functions to check type of variable - here for javascript optimisations and readability, makes a miniscule difference using them

var isArray = function(obj) {// Not an object
    return obj && typeof obj === 'object' && !(obj.propertyIsEnumerable('length')) && typeof obj.length === 'number';
};

var isObject = function(obj) {// Not an array
    return obj && typeof obj === 'object' && (!('length' in obj) || obj.propertyIsEnumerable('length'));
};

var isFunction = function(obj) {
	return typeof obj === 'function';
};

var isNumber = function(num) {
	return typeof num === 'number';
};

var isString = function(str) {
	return typeof str === 'string';
};

var isUndefined = function(obj) {
	return typeof obj === 'undefined';
};

// Big shortcut for being inside a try/catch block
var isWorker = function(obj) {
	try {return Workers[obj.name] === obj;}
	catch(e) {return false;}
};

// Prototypes to ease functionality

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, '');
};

String.prototype.filepart = function() {
	var x = this.lastIndexOf('/');
	if (x >= 0) {
		return this.substr(x+1);
	}
	return this;
};

String.prototype.pathpart = function() {
	var x = this.lastIndexOf('/');
	if (x >= 0) {
		return this.substr(0, x+1);
	}
	return this;
};

String.prototype.regex = function(r) {
	var a = this.match(r), i;
	if (a) {
		!r.global && a.shift();
		for (i=0; i<a.length; i++) {
			if (a[i] && a[i].search(/^[-+]?[0-9]*\.?[0-9]*$/) >= 0) {
				a[i] = parseFloat(a[i]);
			}
		}
		if (a.length===1) {
			return a[0];
		}
	}
	return a;
};

String.prototype.toNumber = function() {
	return parseFloat(this);
};

String.prototype.parseTimer = function() {
	var a = this.split(':'), b = 0, i;
	for (i=0; i<a.length; i++) {
		b = b * 60 + parseInt(a[i],10);
	}
	if (isNaN(b)) {
		b = 9999;
	}
	return b;
};

Number.prototype.round = function(dec) {
	return Math.round(this*Math.pow(10,(dec||0))) / Math.pow(10,(dec||0));
};

Math.range = function(min, num, max) {
	return Math.max(min, Math.min(num, max));
};

//Array.prototype.unique = function() { var o = {}, i, l = this.length, r = []; for(i=0; i<l;i++) o[this[i]] = this[i]; for(i in o) r.push(o[i]); return r; };
//Array.prototype.inArray = function(value) {for (var i in this) if (this[i] === value) return true;return false;};

var makeTimer = function(sec) {
	var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = Math.floor(sec % 60);
	return (h ? h+':'+(m>9 ? m : '0'+m) : m) + ':' + (s>9 ? s : '0'+s);
};

var shortNumber = function(number){
        if (typeof number === 'number'){
            if (number / Math.pow(10,9) >= 1){
                return (number / Math.pow(10,9)).round(1) + ' B';
            } else if (number / Math.pow(10,6) >= 1){
                return (number / Math.pow(10,6)).round(1) + ' M';
            } else if (number / Math.pow(10,3) >= 1){
                return (number / Math.pow(10,3)).round(1) + ' K';
            } else {
                return number;
            }
        }
};

var WorkerByName = function(name) { // Get worker object by Worker.name (case insensitive, use Workers[name] for case sensitive (and speed).
	if (typeof name === 'string') {
		name = name.toLowerCase();
		for (var i in Workers) {
			if (i.toLowerCase() === name) {
				return Workers[i];
			}
		}
	}
	return null;
};

var WorkerById = function(id) { // Get worker object by panel id
	for (var i in Workers) {
		if (Workers[i].id === id) {
			return Workers[i];
		}
	}
	return null;
};

var Divisor = function(number) { // Find a "nice" value that goes into number up to 20 times
	var num = number, step = 1;
	if (num < 20) {
		return 1;
	}
	while (num > 100) {
		num /= 10;
		step *= 10;
	}
	num -= num % 5;
	if ((number / step) > 40) {
		step *= 5;
	} else if ((number / step) > 20) {
		step *= 2.5;
	}
	return step;
};

var length = function(obj) { // Find the number of entries in an object (also works on arrays)
	if (isArray(obj)) {
		return obj.length;
	} else if (typeof obj === 'object') {
		var l = 0, i;
		for(i in obj) {
			l++;
		}
		return l;
	}
	return 0;
};

var unique = function (a) { // Return an array with no duplicates
	var o = {}, i, l = a.length, r = [];
	for(i = 0; i < l; i++) {
		o[a[i]] = a[i];
	}
	for(i in o) {
		r.push(o[i]);
	}
	return r;
};

var deleteElement = function(list, value) { // Removes matching elements from an array
	if (isArray(list)) {
		while (value in list) {
			list.splice(list.indexOf(value), 1);
		}
	}
};
			
var sum = function(a) { // Adds the values of all array entries together
	var i, t = 0;
	if (isArray(a)) {
		for(i=0; i<a.length; i++) {
			t += sum(a[i] || 0);
		}
	} else if (isObject(a)) {
		for(i in a) {
			t += sum(a[i]);
		}
	} else if (isNumber(a)) {
		t = a;
	} else if (isString(a) && a.search(/^[-+]?[0-9]*\.?[0-9]*$/) >= 0) {
		t = parseFloat(a);
	}
	return t;
};

var addCommas = function(s) { // Adds commas into a string, ignore any number formatting
	var a=s ? s.toString() : '0', r=new RegExp('(-?[0-9]+)([0-9]{3})');
	while(r.test(a)) {
		a = a.replace(r, '$1,$2');
	}
	return a;
};

var findInArray = function(list, value) {
	if (isArray(list)) {
		return list.indexOf(value) !== -1;
	} else if (isObject(list)) {
		for (var i in list) {
			if (list[i] === value) {
				return true;
			}
		}
	}
	return false;
};

var findInObject = function(list, value) {
	if (isObject(list)) {
		for (var i in list) {
			if (list[i] === value) {
				return i;
			}
		}
	}
	return null;
};

var objectIndex = function(list, index) {
	if (typeof list === 'object') {
		for (var i in list) {
			if (index-- <= 0) {
				return i;
			}
		}
	}
	return null;
};

var sortObject = function(obj, sortfunc, deep) {
	var i, list = [], output = {};
	if (typeof deep === 'undefined') {
		deep = false;
	}
	for (i in obj) {
		list.push(i);
	}
	list.sort(sortfunc ? sortfunc : function(a,b){return b-a;});
	for (i=0; i<list.length; i++) {
		if (deep && typeof obj[list[i]] === 'object') {
			output[list[i]] = sortObject(obj[list[i]], sortfunc, deep);
		} else {
			output[list[i]] = obj[list[i]];
		}
	}
	return output;
};

var getAttDefList = [];
var getAttDef = function(list, unitfunc, x, count, user) { // Find total att(ack) or def(ense) value from a list of objects (with .att and .def)
	var units = [], attack = 0, defend = 0, x2 = (x==='att'?'def':'att'), i, own;
	if (unitfunc) {
		for (i in list) {
			unitfunc(units, i, list);
		}
	} else {
		units = getAttDefList;
	}
	units.sort(function(a,b) {
		return (list[b][x] + (0.7 * list[b][x2])) - (list[a][x] + (0.7 * list[a][x2]));
	});
	for (i=0; i<units.length; i++) {
		own = typeof list[units[i]].own === 'number' ? list[units[i]].own : 1;
		if (user) {
			if (count) {
				Resources.set(['_'+units[i], user+'_'+x], count);
			} else {
				Resources.set(['_'+units[i], user+'_'+x]);
			}
			if (Math.min(count, own) > 0) {
//				debug('Utility','Using: '+Math.min(count, own)+' x '+units[i]+' = '+JSON.stringify(list[units[i]]));
				if (!list[units[i]].use) {
					list[units[i]].use = {};
				}
				list[units[i]].use[(user+'_'+x)] = Math.min(count, own);
			} else if (length(list[units[i]].use)) {
				delete list[units[i]].use[(user+'_'+x)];
				if (!length(list[units[i]].use)) {
					delete list[units[i]].use;
				}
			}
		}
//		if (count <= 0) {break;}
		own = Math.min(count, own);
		attack += own * list[units[i]].att;
		defend += own * list[units[i]].def;
		count -= own;
	}
	getAttDefList = units;
	return (x==='att'?attack:(0.7*attack)) + (x==='def'?defend:(0.7*defend));
};

var tr = function(list, html, attr) {
	list.push('<tr' + (attr ? ' ' + attr : '') + '>' + (html || '') + '</tr>');
};

var th = function(list, html, attr) {
	list.push('<th' + (attr ? ' ' + attr : '') + '>' + (html || '') + '</th>');
};

var td = function(list, html, attr) {
	list.push('<td' + (attr ? ' ' + attr : '') + '>' + (html || '') + '</td>');
};

var plural = function(i) {
	return (i === 1 ? '' : 's');
};

var makeTime = function(time, format) {
	var d = new Date(time);
	return d.format(typeof format !== 'undefined' && format ? format : 'l g:i a' );
};

// Simulates PHP's date function
Date.prototype.format = function(format) {
	var i, curChar, returnStr = '', replace = Date.replaceChars;
	for (i = 0; i < format.length; i++) {
		curChar = format.charAt(i);
		if (replace[curChar]) {
			returnStr += replace[curChar].call(this);
		} else {
			returnStr += curChar;
		}
	}
	return returnStr;
};

Date.replaceChars = {
	shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	longDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	// Day
	d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
	D: function() { return Date.replaceChars.shortDays[this.getDay()]; },
	j: function() { return this.getDate(); },
	l: function() { return Date.replaceChars.longDays[this.getDay()]; },
	N: function() { return this.getDay() + 1; },
	S: function() { return (this.getDate() % 10 === 1 && this.getDate() !== 11 ? 'st' : (this.getDate() % 10 === 2 && this.getDate() !== 12 ? 'nd' : (this.getDate() % 10 === 3 && this.getDate() !== 13 ? 'rd' : 'th'))); },
	w: function() { return this.getDay(); },
	z: function() { return "Not Yet Supported"; },
	// Week
	W: function() { return "Not Yet Supported"; },
	// Month
	F: function() { return Date.replaceChars.longMonths[this.getMonth()]; },
	m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
	M: function() { return Date.replaceChars.shortMonths[this.getMonth()]; },
	n: function() { return this.getMonth() + 1; },
	t: function() { return "Not Yet Supported"; },
	// Year
	L: function() { return (((this.getFullYear()%4===0)&&(this.getFullYear()%100!==0)) || (this.getFullYear()%400===0)) ? '1' : '0'; },
	o: function() { return "Not Supported"; },
	Y: function() { return this.getFullYear(); },
	y: function() { return ('' + this.getFullYear()).substr(2); },
	// Time
	a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
	A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
	B: function() { return "Not Yet Supported"; },
	g: function() { return this.getHours() % 12 || 12; },
	G: function() { return this.getHours(); },
	h: function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); },
	H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
	i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
	s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
	// Timezone
	e: function() { return "Not Yet Supported"; },
	I: function() { return "Not Supported"; },
	O: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; },
	P: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':' + (Math.abs(this.getTimezoneOffset() % 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() % 60)); },
	T: function() { var m = this.getMonth(), result; this.setMonth(0); result = this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); this.setMonth(m); return result;},
	Z: function() { return -this.getTimezoneOffset() * 60; },
	// Full Date/Time
	c: function() { return this.format("Y-m-d") + "T" + this.format("H:i:sP"); },
	r: function() { return this.toString(); },
	U: function() { return this.getTime() / 1000; }
};

var ucfirst = function(str) {
	return str.charAt(0).toUpperCase() + str.substr(1);
};

var ucwords = function(str) {
	return (str + '').replace(/^(.)|\s(.)/g, function($1){
		return $1.toUpperCase();
	});
};

var calc_rolling_weighted_average = function(object, y_label, y_val, x_label, x_val, limit) {
	var name, label_list, y_label_list, x_label_list;
	name = y_label + '_per_' + x_label;
	object.rwa = object.rwa || {};
	label_list = object.rwa[name] = object.rwa[name] || {};
	y_label_list = label_list[y_label] = label_list[y_label] || [];
	x_label_list = label_list[x_label] = label_list[x_label] || [];
	y_label_list.unshift(y_val);
	x_label_list.unshift(x_val);
	while (y_label_list.length > (limit || 100)) {
		y_label_list.pop();
	}
	while (x_label_list.length > (limit || 100)) {
		x_label_list.pop();
	}
	object['avg_' + name] = sum(y_label_list) / sum(x_label_list);
};

var bestValue = function(list, value) {// pass a list of numbers, return the highest entry lower than value, return -1 on failure
	var i, best = -1;
	for (i=0; i<list.length && list[i] <= value; i++) {
		best = list[i];
	}
	return best;
};

var bestObjValue = function(obj, callback) {// pass an object and a function to create a value from obj[key] - return the best key
	var i, best = null, bestval, val;
	for (i in obj) {
		val = callback(obj[i]);
		if (isNumber(val) && (!best || val > bestval)) {
			bestval = val;
			best = i;
		}
	}
	return best;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isGreasemonkey, GM_setValue, GM_getValue, localStorage, window,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/* Worker Prototype
   ----------------
new Worker(name, pages, settings)

*** User data***
.id				- If we have a .display then this is the html #id of the worker
.name			- String, the same as our class name.
.pages			- String, list of pages that we want in the form "town.soldiers keep.stats"
.data			- Object, for public reading, automatically saved
.option			- Object, our options, changed from outide ourselves
.settings		- Object, various values for various sections, default is always false / blank
				system (true/false) - exists for all games
				unsortable (true/false) - stops a worker being sorted in the queue, prevents this.work(true)
				advanced (true/false) - only visible when "Advanced" is checked
				before (array of worker names) - never let these workers get before us when sorting
				after (array of worker names) - never let these workers get after us when sorting
				keep (true/false) - without this data is flushed when not used - only keep if other workers regularly access you
				important (true/false) - can interrupt stateful workers [false]
				stateful (true/false) - only interrupt when we return QUEUE_RELEASE from work(true)
				gm_only (true/false) - only enable worker if we're running under greasemonkey
.display		- Create the display object for the settings page.
.defaults		- Object filled with objects. Assuming in an APP called "castle_age" then myWorker.defaults['castle_age'].* gets copied to myWorker.*

*** User functions - should be in worker if needed ***
.init()			- After the script has loaded, but before anything else has run. Data has been filled, but nothing has been run.
				This is the bext place to put default actions etc...
				Cannot rely on other workers having their data filled out...
.parse(change)  - This can read data from the current page and cannot perform any actions.
				change = false - Not allowed to change *anything*, cannot read from other Workers.
				change = true - Can now change inline and read from other Workers.
				return true - We need to run again with status=1
				return QUEUE_RELEASE - We want to run again with status=1, but feel free to interrupt (makes us stateful)
				return false - We're finished
.work(state)    - Do anything we need to do when it's our turn - this includes page changes. This is part the of Queue worker.
				state = false - It's not our turn, don't start anything if we can't finish in this one call, this.data is null
				state = true - It's our turn, do everything - Only true if not interrupted, this.data is useable
				return true or QUEUE_RELEASE if we *want* to continue working, but can be interrupted
				return QUEUE_CONTINUE if we *need* to continue working and don't want to be interrupted
				return false or QUEUE_FINISH when someone else can work
.update(type,worker)	- Called when the data, options or runtime have been changed
				type = "data", "option", "runtime", "reminder" or null (only for first call after init())
				worker = null (for worker = this), otherwise another worker (due to _watch())
.get(what)		- Calls this._get(what)
				Official way to get any information from another worker
				Overload for "special" data, and pass up to _get if basic data
.set(what,value)- Calls this._set(what,value)
				Official way to set any information for another worker
				Overload for "special" data, and pass up to _set if basic data

NOTE: If there is a work() but no display() then work(false) will be called before anything on the queue, but it will never be able to have focus (ie, read only)

*** Private data ***
._loaded		- true once ._init() has run
._working		- Prevent recursive calling of various private functions
._changed		- Timestamp of the last time this.data changed
._watching		- List of other workers that want to have .update() after this.update()
._reminders		- List of reminders in 'i...':interval or 't...':timeout format

*** Private functions - only overload if you're sure exactly what you're doing ***
._get(what,def)			- Returns the data requested, auto-loads if needed, what is 'path.to.data', default if not found
._set(what,val)			- Sets this.data[what] to value, auto-loading if needed. Deletes "empty" data sets (if you don't pass a value)

._setup()				- Only ever called once - might even remove us from the list of workers, otherwise loads the data...
._init(keep)			- Calls .init(), loads then saves data (for default values), delete this.data if !nokeep and settings.nodata, then removes itself from use

._load(type)			- Loads data / option from storage, merges with current values, calls .update(type) on change
._save(type)			- Saves data / option to storage, calls .update(type) on change

._flush()				- Calls this._save() then deletes this.data if !this.settings.keep
._unflush()				- Loads .data if it's not there already

._parse(change)			- Calls this.parse(change) inside a try / catch block
._work(state)			- Calls this.work(state) inside a try / catch block

._update(type,worker)	- Calls this.update(type,worker), loading and flushing .data if needed. worker is "null" unless a watched worker.

._watch(worker)			- Add a watcher to worker - so this.update() gets called whenever worker.update() does
._unwatch(worker)		- Removes a watcher from worker (safe to call if not watching).

._remind(secs,id)		- Calls this._update('reminder',null) after a specified delay. Replaces old 'id' if passed (so only one _remind() per id active)
._revive(secs,id)		- Calls this._update('reminder',null) regularly. Replaces old 'id' if passed (so only one _revive() per id active)
._forget(id)			- Forgets all _remind() and _revive() with the same id

._push()				- Pushes us onto the "active worker" list for debug messages etc
._pop()					- Pops us off the "active worker" list
*/
var Workers = {};// 'name':worker

if (isGreasemonkey) {
	var setItem = function(n,v){GM_setValue(n, v);};// Must make per-APP when we go to multi-app
	var getItem = function(n){return GM_getValue(n);};// Must make per-APP when we go to multi-app
} else {
	var setItem = function(n,v){localStorage.setItem('golem.' + APP + '.' + n, v);};
	var getItem = function(n){return localStorage.getItem('golem.' + APP + '.' + n);};
}

function Worker(name,pages,settings) {
	Workers[name] = this;

	// User data
	this.id = 'golem_panel_'+name.toLowerCase().replace(/[^0-9a-z]/g,'-');
	this.name = name;
	this.pages = pages;

	this.defaults = {}; // {'APP':{data:{}, options:{}} - replaces with app-specific data, can be used for any this.* wanted...

	this.settings = settings || {};

	this.data = {};
	this.option = {};
	this.runtime = null;// {} - set to default runtime values in your worker!
	this.display = null;

	// User functions
	this.init = null; //function() {};
	this.parse = null; //function(change) {return false;};
	this.work = null; //function(state) {return false;};
	this.update = null; //function(type,worker){};
	this.get = function(what,def) {return this._get(what,def);}; // Overload if needed
	this.set = function(what,value) {return this._set(what,value);}; // Overload if needed

	// Private data
	this._rootpath = true; // Override save path, replaces userID + '.' with ''
	this._loaded = false;
	this._working = {data:false, option:false, runtime:false, update:false};
	this._changed = Date.now();
	this._watching = [];
	this._reminders = {};
	this._disabled = false;
}

// Static data
Worker.stack = [];// array of active workers, last on the end
Worker.current = '';

// Private functions - only override if you know exactly what you're doing
Worker.prototype._flush = function() {
	this._push();
	this._save();
	if (!this.settings.keep) {
		delete this.data;
	}
	this._pop();
};

Worker.prototype._forget = function(id) {
	var forgot = false;
	if (id) {
		if (this._reminders['i' + id]) {
			window.clearInterval(this._reminders['i' + id]);
			delete this._reminders['i' + id];
			forgot = true;
		}
		if (this._reminders['t' + id]) {
			window.clearTimeout(this._reminders['t' + id]);
			delete this._reminders['t' + id];
			forgot = true;
		}
	}
	return forgot;
};

Worker.prototype._get = function(what, def) { // 'path.to.data'
	var x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []), data;
	if (!x.length || (x[0] !== 'data' && x[0] !== 'option' && x[0] !== 'runtime')) {
		x.unshift('data');
	}
	if (x[0] === 'data') {
		if (!this._loaded) {
			this._init();
		}
		this._unflush();
	}
	data = this[x.shift()];
	try {
		return (function(a,b){
			if (b.length) {
				return arguments.callee(a[b.shift()],b);
			} else {
				return typeof a !== 'undefined' ? (a === null ? null : a.valueOf()) : def;
			}
		})(data,x);
	} catch(e) {
//		this._push();
		if (typeof def === 'undefined') {
			debug(e.name + ' in ' + this.name + '.get('+what.toString()+', '+(typeof def === 'undefined' ? 'undefined' : def)+'): ' + e.message);
		}
//		this._pop();
	}
	return typeof def !== 'undefined' ? def : null;// Don't want to return "undefined" at this time...
};

Worker.prototype._init = function() {
	if (this._loaded) {
		return;
	}
	this._push();
	this._loaded = true;
	if (this.init) {
		try {
			this.init();
		}catch(e) {
			debug(e.name + ' in ' + this.name + '.init(): ' + e.message);
		}
	}
	this._pop();
};

Worker.prototype._load = function(type) {
	if (type !== 'data' && type !== 'option' && type !== 'runtime') {
		this._load('data');
		this._load('option');
		this._load('runtime');
		return;
	}
	this._push();
	var v = getItem((this._rootpath ? userID + '.' : '') + type + '.' + this.name);
	if (v) {
		try {
			v = JSON.parse(v);
		} catch(e) {
			debug(this.name + '._load(' + type + '): Not JSON data, should only appear once for each type...');
//			v = eval(v); // We used to save our data in non-JSON format...
		}
		this[type] = $.extend(true, {}, this[type], v);
	}
	this._pop();
};

Worker.prototype._parse = function(change) {
	this._push();
	var result = false;
	try {
		result = this.parse && this.parse(change);
	}catch(e) {
		debug(e.name + ' in ' + this.name + '.parse(' + change + '): ' + e.message);
	}
	this._pop();
	return result;
};

Worker.prototype._pop = function() {
	Worker.stack.pop();
	Worker.current = Worker.stack.length ? Worker.stack[Worker.stack.length - 1].name : '';
};

Worker.prototype._push = function() {
	Worker.stack.push(this);
	Worker.current = this.name;
};

Worker.prototype._revive = function(seconds, id) {
	var me = this, timer = window.setInterval(function(){me._update('reminder', null);}, seconds * 1000);
	if (id) {
		if (this._reminders['i' + id]) {
			window.clearInterval(this._reminders['i' + id]);
		}
		this._reminders['i' + id] = timer;
	}
	return timer;
};

Worker.prototype._remind = function(seconds, id) {
	var me = this, timer = window.setTimeout(function(){me._update('reminder', null);}, seconds * 1000);
	if (id) {
		if (this._reminders['t' + id]) {
			window.clearTimeout(this._reminders['t' + id]);
		}
		this._reminders['t' + id] = timer;
	}
	return timer;
};

Worker.prototype._save = function(type) {
	if (type !== 'data' && type !== 'option' && type !== 'runtime') {
		return this._save('data') + this._save('option') + this._save('runtime');
	}
	if (typeof this[type] === 'undefined' || !this[type] || this._working[type]) {
		return false;
	}
	var n = (this._rootpath ? userID + '.' : '') + type + '.' + this.name, v = JSON.stringify(this[type]);
	if (getItem(n) === 'undefined' || getItem(n) !== v) {
		this._push();
		this._working[type] = true;
		this._changed = Date.now();
		this._update(type, null);
		setItem(n, v);
		this._working[type] = false;
		this._pop();
		return true;
	}
	return false;
};

Worker.prototype._set = function(what, value) {
//	this._push();
	var x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []), data;
	if (!x.length || (x[0] !== 'data' && x[0] !== 'option' && x[0] !== 'runtime')) {
		x.unshift('data');
	}
	if (x[0] === 'data') {
		if (!this._loaded) {
			this._init();
		}
		this._unflush();
	}
	data = this[x.shift()];
	if (x.length) {
		try {
			(function(a,b){ // Don't allow setting of root data/object/runtime
				var c = b.shift();
				if (b.length) {
					if (typeof a[c] !== 'object') {
						a[c] = {};
					}
					if (!arguments.callee(a[c],b) && !length(a[c])) {// Can clear out empty trees completely...
						delete a[c];
						return false;
					}
				} else {
					if (typeof value === 'undefined') {
						delete a[c];
						return false;
					} else {
						a[c] = value;
					}
				}
				return true;
			})(data,x);
//			this._save();
		} catch(e) {
			debug(e.name + ' in ' + this.name + '.set('+what+', '+(typeof value === 'undefined' ? 'undefined' : value)+'): ' + e.message);
		}
	}
//	this._pop();
	return value;
};

Worker.prototype._setup = function() {
	this._push();
	if ((!this.settings.gm_only || isGreasemonkey) && (this.settings.system || !length(this.defaults) || this.defaults[APP])) {
		if (this.defaults[APP]) {
			for (var i in this.defaults[APP]) {
				this[i] = this.defaults[APP][i];
			}
		}
		this._load();
	} else { // Get us out of the list!!!
		delete Workers[this.name];
	}
	this._pop();
};

Worker.prototype._unflush = function() {
	this._push();
	if (!this._loaded) {
		this._init();
	}
	if (!this.settings.keep && !this.data) {
		this._load('data');
	}
	this._pop();
};

Worker.prototype._unwatch = function(worker) {
	if (typeof worker === 'string') {
		worker = WorkerByName(worker);
	}
	if (isWorker(worker)) {
		deleteElement(worker._watching,this);
	}
};

Worker.prototype._update = function(type, worker) {
	if (this._loaded && (this.update || this._watching.length)) {
		this._push();
		var i, flush = false;
		this._working.update = true;
		if (typeof worker === 'undefined') {
			worker = null;
		}
		if (typeof this.data === 'undefined') {
			flush = true;
			this._unflush();
		}
		try {
			if (this.update) {
				this.update(type, worker);
			}
		}catch(e) {
			debug(e.name + ' in ' + this.name + '.update(' + (type ? type : 'null') + ', ' + (worker ? worker.name : 'null') + '): ' + e.message);
		}
		if (!worker && type) {
			for (i=0; i<this._watching.length; i++) {
				this._watching[i]._update(type, this);
			}
		}
		if (flush) {
			this._flush();
		}
		this._working.update = false;
		this._pop();
	}
};

Worker.prototype._watch = function(worker) {
	if (typeof worker === 'string') {
		worker = WorkerByName(worker);
	}
	if (isWorker(worker) && !findInArray(worker._watching,this)) {
		worker._watching.push(this);
	}
};

Worker.prototype._work = function(state) {
	this._push();
	var result = false;
	try {
		result = this.work && this.work(state);
	}catch(e) {
		debug(e.name + ' in ' + this.name + '.work(' + state + '): ' + e.message);
	}
	this._pop();
	return result;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army:true, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Army **********
* Stores data by facebook userid for any worker that wants to use it.
* Data is stored as -
* Army.data.uid.section[...] = value
* section == '_info' for general use of any workers with data useful for many
* section == '_last' is the last time the data was accessed (not including making a list)
*/
var Army = new Worker('Army');
Army.data = {};

Army.settings = {
	system:true,
	advanced:true
};

Army.option = {
	forget:14// Number of days to remember any userid
};

Army.runtime = {
	update:{},// WorkerName:true, cleared in Army.update() as we poll each in turn
	// Dashboard defaults:
	sort:0,rev:false,show:'Name',info:'uid'
};
/*
Army.display = [
	{
		id:'forget',
		label:'Forget after',
		select:[1,2,3,4,5,6,7,14,21,28],
		after:'days',
		help:'This will delete any userID that\'s not been seen for a length of time'
	}
];
*/
Army.update = function(type,worker) {
	if (type === 'data' && !worker) {
		for (var i in this.runtime.update) {
			Workers[i]._update(type, this);
			delete this.runtime.update[i];
		}
	}
};

Army.init = function() {
	$('#content').append('<div id="golem-army-tooltip" class="golem-tooltip"><a>&nbsp;x&nbsp;</a><p></p></div>');
	$('#golem-army-tooltip > a').click(function(){$('#golem-army-tooltip').hide();});
	$('#golem-army-tooltip a[href*="keep.php"]').live('click', function(){
		Page.to('keep_stats', $(this).attr('href').substr($(this).attr('href').indexOf('?')));
		return false;
	});
	for (var i in this.data) {// Fix for accidentally added bad data in a previous version
		if (typeof i === 'string' && i.regex(/[^0-9]/g)) {
			delete this.data[i];
		}
	}
};

// what = ['worker', userID, key ...]
Army.set = function(what, value) {
	var x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []), section = null, uid = null;
	if (x[0] === 'option' || x[0] === 'runtime') {
		return this._set(x, value);// Pasthrough
	}
	// Section first - either string id, worker.name, or current_worker.name
	if (isWorker(x[0])) {
		section = x.shift().name;
	} else if (typeof x[0] === 'string' && x[0].regex(/[^0-9]/gi)) {
		section = x.shift();
	} else {
		section = Worker.current;
	}
	// userID next
	if (x.length && typeof x[0] === 'string' && !x[0].regex(/[^0-9]/gi)) {
		uid = x.shift();
	}
	if (!section || !uid) { // Must have both section name and userID to continue
		return;
	}
//	log('this._set(\'data.' + uid + '.' + section + (x.length ? '.' + x.join('.') : '') + ', ' + value + ')');
	if (section in Workers && !section in this.runtime.update) {
		this.runtime.update[section] = true;
	}
// Removed for performance reasons...
//	this._set(['data', uid, '_last'], Date.now()); // Remember when it was last accessed
	x.unshift('data', uid, section);
	return this._set(x, value);
};

// what = [] (for list of uids that this worker knows about), ['section', userID, key ...]
Army.get = function(what, def) {
	var i, x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []), section = null, uid = null, list = [];
	if (x[0] === 'option' || x[0] === 'runtime') {
		return this._get(x, def);// Pasthrough
	}
	// Section first - either string id, worker.name, or current_worker.name
	if (isWorker(x[0])) {
		section = x.shift().name;
	} else if (typeof x[0] === 'string' && x[0].regex(/[^0-9]/gi)) {
		section = x.shift();
	} else {
		section = Worker.current;
	}
	// No userid, so return a list of userid's used by this section
	if (section && x.length === 0) {
		this._unflush();
		for (i in this.data) {
			if (section in this.data[i]) {
				list.push(i);
			}
		}
		return list;
	}
	// userID next
	if (x.length && typeof x[0] === 'string' && !x[0].regex(/[^0-9]/gi)) {
		uid = x.shift();
	}
	if (!section || !uid) { // Must have both section name and userID to continue
		return;
	}
// Removed for performance reasons...
//	this._set(['data', uid, '_last'], Date.now()); // Remember when it was last accessed
	x.unshift('data', uid, section);
	return this._get(x, def);
};

Army.infolist = {
	'UserID':'uid',
	'Level':'level',
	'Army':'army'
};
Army.sectionlist = {
	'Name':{ // First column = Name
		'key':'_info',
		'name':'Name',
		'label':function(data,uid){
			return typeof data[uid]['_info']['name'] !== 'undefined' ? data[uid]['_info']['name'] : '';
		},
		'sort':function(data,uid){
			return typeof data[uid]['_info']['name'] !== 'undefined' ? data[uid]['_info']['name'] : null;
		},
		'tooltip':function(data,uid){
			var space = '&nbsp;&nbsp;&nbsp;', $tooltip;
			$tooltip = $('<a href="http://apps.facebook.com/castle_age/keep.php?user=' + uid + '">Visit Keep</a><hr><b>' + uid + ':</b> {<br>' + ((function(obj,indent){
				var i, output = '';
				for(i in obj) {
					output = output + indent + (isArray(obj) ? '' : '<b>' + i + ':</b> ');
					if (isArray(obj[i])) {
						output = output + '[<br>' + arguments.callee(obj[i],indent + space).replace(/,<br>$/, '<br>') + indent + ']';
					} else if (typeof obj[i] === 'object') {
						output = output + '{<br>' + arguments.callee(obj[i],indent + space).replace(/,<br>$/, '<br>') + indent + '}';
					} else if (typeof obj[i] === 'string') {
						output = output + '"' + obj[i] + '"';
					} else {
						output = output + obj[i];
					}
					output = output + ',<br>';
				}
				return output;
			})(data[uid],space).replace(/,<br>$/, '<br>')) + '}<br>');
			return $tooltip;
		}
	},
	'Info':{ // Second column = Info
		'key':'_info',
		'name':function(){return 'Info (' + (findInObject(Army.infolist, Army.runtime.info) || '') + ')';},
		'show':'Info',
		'label':function(data,uid){
			return Army.runtime.info === 'uid' ? uid : typeof data[uid]['_info'][Army.runtime.info] !== 'undefined' ? data[uid]['_info'][Army.runtime.info] : '';
		},
		'sort':function(data,uid){
			return Army.runtime.info === 'uid' ? uid : typeof data[uid]['_info'][Army.runtime.info] !== 'undefined' ? data[uid]['_info'][Army.runtime.info] : null;
		}
	}
};
Army.section = function(name, object) {
	// Add a section to the dashboard.
	// callback = function(type, data), returns text or html string
	// type = 'id', 'sort', 'tooltip'
	this.sectionlist[name] = object;
};
Army.getSection = function(show, key, uid) {
	try {
		if (isNumber(show)) {
			show = objectIndex(this.sectionlist, show);
		}
		switch(typeof this.sectionlist[show][key]) {
			case 'string':
				return this.sectionlist[show][key];
			case 'function':
				return this.sectionlist[show][key](this.data, uid);
			default:
				return '';
		}
	} catch(e){}// *Really* don't want to do anything in the catch as it's performance sensitive!
	return '';
};

Army.order = [];
Army.dashboard = function(sort, rev) {
	var i, j, k, label, show = this.runtime.show, info = this.runtime.info, list = [], output = [], showsection = [], showinfo = [];
	if ($('#golem-army-show').length) {
		show = $('#golem-army-show').attr('value');
	}
	if ($('#golem-army-info').length) {
		info = $('#golem-army-info').attr('value');
	}
	if (typeof sort === 'undefined' || this.runtime.show !== show || this.runtime.info !== info) {
		this.runtime.show = show;
		this.runtime.info = info;
		this.order = [];
		k = this.getSection(show, 'key');
		for (i in this.data) {
			try {
				label = this.getSection(show, 'sort', i);
				if (label) {
					this.order.push(i);
				}
			} catch(e){}
		}
	}
	for (i in this.sectionlist) {
		th(output, this.getSection(i, 'name'));
		k = this.getSection(i, 'show');
		if (k && k!== '') {
			showsection.push('<option value="' + i + '"' + (i === show ? ' selected' : '') + '>' + k + '</option>');
		}
	}
	for (i in this.infolist) {
		showinfo.push('<option value="' + (this.infolist[i] || '') + '"' + (this.infolist[i] === info ? ' selected' : '') + '>' + i + '</option>');
	}
	list.push('Limit entries to <select id="golem-army-show">' + showsection.join('') + '</select> ... Info: <select id="golem-army-info">' + showinfo.join('') + '</select>');
	if (sort !== this.runtime.sort || rev !== this.runtime.rev) {
		this.runtime.sort = sort = typeof sort !== 'undefined' ? sort : (this.runtime.sort || 0);
		this.runtime.rev = rev = typeof rev !== 'undefined' ? rev : (this.runtime.rev || false);
		this.order.sort(function(a,b) {
			var aa = 0, bb = 0;
			try {
				aa = Army.getSection(sort, 'sort', a);
			} catch(e1){}
			try {
				bb = Army.getSection(sort, 'sort', b);
			} catch(e2){}
			if (typeof aa === 'string' || typeof bb === 'string') {
				return (rev ? (''+bb).localeCompare(aa) : (''+aa).localeCompare(bb));
			}
			return (rev ? (aa || 0) - (bb || 0) : (bb || 0) - (aa || 0));
		});
	}
	list.push('<table cellspacing="0" style="width:100%"><thead><tr>' + output.join('') + '</tr></thead><tbody>');
	for (j=0; j<this.order.length; j++) {
		output = [];
		for (i in this.sectionlist) {
			try {
//				if (typeof this.data[this.order[j]][this.getSection(i,'key')] !== 'undefined') {
				k = this.getSection(i,'label', this.order[j]);
				if (typeof k !== 'undefined' && k !== null && k !== '') {
					if (this.sectionlist[i]['tooltip'] || this.sectionlist[i]['click']) {
						td(output, '<a>' + k + '</a>');
					} else {
						td(output, k);
					}
				} else {
					td(output, '');
				}
			} catch(e3) {
				debug(e3.name + ' in Army.dashboard(): ' + i + '("label"): ' + e3.message);
				td(output, '');
			}
		}
		tr(list, output.join(''));//, 'style="height:25px;"');
	}
	list.push('</tbody></table>');
	$('#golem-dashboard-Army').html(list.join(''));
	$('#golem-dashboard-Army td:first-child,#golem-dashboard-Army th:first-child').css('text-align', 'left');
	$('#golem-dashboard-Army select').change(function(e){Army._unflush();Army.dashboard();});// Force a redraw
	$('#golem-dashboard-Army thead th:eq('+sort+')').attr('name',(rev ? 'reverse' : 'sort')).append('&nbsp;' + (rev ? '&uarr;' : '&darr;'));
	$('#golem-dashboard-Army td a').click(function(e){
		e.stopPropagation();
		var $this, section, uid, tooltip;
		$this = $(this.wrappedJSObject ? this.wrappedJSObject : this);
		try {
			section = objectIndex(Army.sectionlist, $this.closest('td').index());
			uid = Army.order[$this.closest('tr').index()];
			Army._unflush();
			if ('click' in Army.sectionlist[section]) {
				if (Army.getSection(section, 'click', uid)) {
					$this.html('<a>' + Army.getSection(section, 'label', uid) + '</a>');
//					Army.dashboard(Army.runtime.show, Army.runtime.rev);
				}
			} else {
				tooltip = Army.getSection(section, 'tooltip', uid);
				if (tooltip && tooltip !== '') {
					$('#golem-army-tooltip > p').html(tooltip);
					$('#golem-army-tooltip').css({
						top:($this.offset().top + $this.height()),
						left:$this.closest('td').offset().left
					}).show();
				}
			}
		} catch(e4) {
			debug(e4.name + ' in Army.dashboard(): ' + Army.getSection($this.closest('td').index(),'name') + '(data,"tooltip"): ' + e4.message);
		}
		return false;
	});
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Config **********
* Has everything to do with the config
*/
var Config = new Worker('Config');

Config.settings = {
	system:true,
	keep:true
};

Config.option = {
	display:'block',
	fixed:true,
	advanced:false,
	exploit:false
};

Config.init = function() {
	$('head').append('<link rel="stylesheet" href="http://cloutman.com/css/base/jquery-ui.css" type="text/css" />');
	var i, j, k, $display;
	$display = $('<div id="golem_config_frame" class="golem-config ui-widget-content' + (Config.option.fixed?' golem-config-fixed':'') + '" style="display:none;"><div class="golem-title">Castle Age Golem ' + (isRelease ? 'v'+version : 'r'+revision) + '<img id="golem_fixed" src="' + Images.blank + '"></div><div id="golem_buttons"><img class="golem-button' + (Config.option.display==='block'?'-active':'') + '" id="golem_options" src="' + Images.options + '"></div><div style="display:'+Config.option.display+';"><div id="golem_config" style="overflow:hidden;overflow-y:auto;"></div><div style="text-align:right;"><label>Advanced <input type="checkbox" id="golem-config-advanced"' + (Config.option.advanced ? ' checked' : '') + '></label></div></div></div>');
	$('div.UIStandardFrame_Content').after($display);// Should really be inside #UIStandardFrame_SidebarAds - but some ad-blockers remove that
	$('#golem_options').click(function(){
		$(this).toggleClass('golem-button golem-button-active');
		Config.option.display = Config.option.display==='block' ? 'none' : 'block';
		$('#golem_config').parent().toggle('blind'); //Config.option.fixed?null:
		Config._save('option');
	});
	$('#golem_fixed').click(function(){
		Config.option.fixed ^= true;
		$(this).closest('.golem-config').toggleClass('golem-config-fixed');
		Config._save('option');
	});
	for (i in Workers) {
		Config.makePanel(Workers[i]);
	}
	$('.golem-config .golem-panel > h3').click(function(event){
		if ($(this).parent().hasClass('golem-panel-show')) {
			$(this).next().hide('blind',function(){
				$(this).parent().toggleClass('golem-panel-show');
				Config.option.active = [];
				$('.golem-panel-show').each(function(i,el){Config.option.active.push($(this).attr('id'));});
				Config._save('option');
			});
		} else {
			$(this).parent().toggleClass('golem-panel-show');
			$(this).next().show('blind');
			Config.option.active = [];
			$('.golem-panel-show').each(function(i,el){Config.option.active.push($(this).attr('id'));});
			Config._save('option');
		}
	});
	$('#golem_config .golem-panel-sortable')
		.draggable({
			axis:'y',
			distance:5,
			scroll:false,
			handle:'h3',
			helper:'clone',
			opacity:0.75,
			zIndex:100,
			refreshPositions:true,
			containment:'parent',
			stop:function(event,ui) {
				Queue.clearCurrent();// Make sure we deal with changed circumstances
				Config.updateOptions();
			}
		})
		.droppable({
			tolerance:'pointer',
			over:function(e,ui) {
				var i, order = Config.getOrder(), me = WorkerByName($(ui.draggable).attr('name')), newplace = order.indexOf($(this).attr('name'));
				if (order.indexOf('Idle') >= newplace) {
					if (me.settings.before) {
						for(i=0; i<me.settings.before.length; i++) {
							if (order.indexOf(me.settings.before[i]) <= newplace) {
								return;
							}
						}
					}
					if (me.settings.after) {
						for(i=0; i<me.settings.after.length; i++) {
							if (order.indexOf(me.settings.after[i]) >= newplace) {
								return;
							}
						}
					}
				}
				if (newplace < order.indexOf($(ui.draggable).attr('name'))) {
					$(this).before(ui.draggable);
				} else {
					$(this).after(ui.draggable);
				}
			}
		});
	for (i in Workers) { // Propagate all before and after settings
		if (Workers[i].settings.before) {
			for (j=0; j<Workers[i].settings.before.length; j++) {
				k = WorkerByName(Workers[i].settings.before[j]);
				if (k) {
					k.settings.after = k.settings.after || [];
					k.settings.after.push(Workers[i].name);
					k.settings.after = unique(k.settings.after);
//					debug('Pushing '+k.name+' after '+Workers[i].name+' = '+k.settings.after);
				}
			}
		}
		if (Workers[i].settings.after) {
			for (j=0; j<Workers[i].settings.after.length; j++) {
				k = WorkerByName(Workers[i].settings.after[j]);
				if (k) {
					k.settings.before = k.settings.before || [];
					k.settings.before.push(Workers[i].name);
					k.settings.before = unique(k.settings.before);
//					debug('Pushing '+k.name+' before '+Workers[i].name+' = '+k.settings.before);
				}
			}
		}
	}
	$.expr[':'].golem = function(obj, index, meta, stack) { // $('input:golem(worker,id)') - selects correct id
		var args = meta[3].toLowerCase().split(',');
		if ($(obj).attr('id') === PREFIX + args[0].trim().replace(/[^0-9a-z]/g,'-') + '_' + args[1].trim()) {
			return true;
		}
		return false;
	};
	$('input.golem_addselect').live('click', function(){
		var i, value, values = $('.golem_select', $(this).parent()).val().split(',');
		for (i=0; i<values.length; i++) {
			value = values[i].trim();
			if (value) {
				$('select.golem_multiple', $(this).parent()).append('<option>' + value + '</option>');
			}
		}
		Config.updateOptions();
	});
	$('input.golem_delselect').live('click', function(){
		$('select.golem_multiple option[selected=true]', $(this).parent()).each(function(i,el){$(el).remove();});
		Config.updateOptions();
	});
	$('#golem_config input,textarea,select').live('change', function(){
		Config.updateOptions();
	});
	$('#golem-config-advanced').click(function(){
		Config.updateOptions();
		$('.golem-advanced:not(".golem-require")').css('display', Config.option.advanced ? '' : 'none');
		Config.checkRequire();
	});
	$('.golem-panel-header input').click(function(event){
		event.stopPropagation(true);
	});
	this.checkRequire();
	$('#golem_config_frame').show();// make sure everything is created before showing (css sometimes takes another second to load though)
};

Config.makePanel = function(worker, args) {
	if (!isWorker(worker)) {
		if (!Worker.current) {
			return;
		}
		args = worker;
		worker = Worker.current;
	}
	if (!args) {
		if (!worker.display) {
			return;
		}
		args = worker.display;
	}
//	worker.id = 'golem_panel_'+worker.name.toLowerCase().replace(/[^0-9a-z]/g,'-');
	if (!$('#'+worker.id).length) {
		$('#golem_config').append('<div id="' + worker.id + '" class="golem-panel' + (worker.settings.unsortable?'':' golem-panel-sortable') + (findInArray(this.option.active, worker.id)?' golem-panel-show':'') + (worker.settings.advanced ? ' golem-advanced' : '') + '"' + ((worker.settings.advanced && !this.option.advanced) || (worker.settings.exploit && !this.option.exploit) ? ' style="display:none;"' : '') + ' name="' + worker.name + '"><h3 class="golem-panel-header' + (!Queue.enabled(worker) ? ' red' : '') + '"><img class="golem-icon" src="' + Images.blank + '">' + worker.name + '<input id="'+this.makeID(Queue,'enabled.'+worker.name)+'" type="checkbox"' + (Queue.enabled(worker) ? ' checked' : '') + (!worker.work || worker.settings.unsortable ? ' disabled="true"' : '') + '><img class="golem-lock" src="' + Images.lock + '"></h3><div class="golem-panel-content" style="font-size:smaller;"></div></div>');
	} else {
		$('#'+worker.id+' > div').empty();
	}
	this.addOption(worker, args);
	this.checkRequire(worker.id);
};

Config.makeID = function(worker, id) {
	return PREFIX + worker.name.toLowerCase().replace(/[^0-9a-z]/g,'-') + '_' + id;
};

Config.clearPanel = function(selector) {
	this._init(); // Make sure we're properly loaded first!
	if (isWorker(selector)) {
		selector = '#'+selector.id+' > div';
	} else if (typeof selector === 'undefined' || !selector) {
		if (!Worker.current) {
			return;
		}
		selector = '#'+Workers[Worker.current].id+' > div';
	}
	$(selector).empty();
};

Config.addOption = function(selector, args) {
	this._init(); // Make sure we're properly loaded first!
	var worker;
	if (isWorker(selector)) {
		worker = selector;
		selector = '#'+selector.id+' > div';
	} else if (typeof args === 'undefined' || !args) {
		if (!Worker.current) {
			return;
		}
		worker = Workers[Worker.current];
		args = selector;
		selector = '#'+worker.id+' > div';
	}
	$(selector).append(this.makeOptions(worker, args));
};

Config.makeOptions = function(worker, args) {
	this._init(); // Make sure we're properly loaded first!
	if (isArray(args)) {
		var i, $output = $([]);
		for (i=0; i<args.length; i++) {
			$output = $output.add(this.makeOptions(worker, args[i]));
		}
		return $output;
	} else if (isObject(args)) {
		return this.makeOption(worker, args);
	} else if (isString(args)) {
		return this.makeOption(worker, {title:args});
	} else if (isFunction(args)) {
		try {
			return this.makeOptions(worker, args.call(worker));
		} catch(e) {
			debug(e.name + ' in Config.makeOptions(' + worker.name + '.display()): ' + e.message);
		}
	} else {
		debug(Worker.current+' is trying to add an unknown type of option');
	}
	return $([]);
};

Config.makeOption = function(worker, args) {
	var i, o, step, $option, txt = [], list = [];
	o = $.extend(true, {}, {
		before: '',
		after: '',
		suffix: '',
		className: '',
		between: 'to',
		size: 7,
		min: 0,
		max: 100
	}, args);
	o.real_id = o.id ? ' id="' + this.makeID(worker, o.id) + '"' : '';
	o.value = worker.get('option.'+o.id, null);
	o.alt = (o.alt ? ' alt="'+o.alt+'"' : '');
	if (o.hr) {
		txt.push('<br><hr style="clear:both;margin:0;">');
	}
	if (o.title) {
		txt.push('<div style="text-align:center;font-size:larger;font-weight:bold;">'+o.title.replace(' ','&nbsp;')+'</div>');
	}
	if (o.label && !o.button) {
		txt.push('<span style="float:left;margin-top:2px;">'+o.label.replace(' ','&nbsp;')+'</span>');
		if (o.text || o.checkbox || o.select) {
			txt.push('<span style="float:right;">');
		} else if (o.multiple) {
			txt.push('<br>');
		}
	}
	if (o.before) {
		txt.push(o.before+' ');
	}
	// our different types of input elements
	if (o.info) { // only useful for externally changed
		if (o.id) {
			txt.push('<span style="float:right"' + o.real_id + '>' + (o.value || o.info) + '</span>');
		} else {
			txt.push(o.info);
		}
	} else if (o.text) {
		txt.push('<input type="text"' + o.real_id + ' size="' + o.size + '" value="' + (o.value || isNumber(o.value) ? o.value : '') + '">');
	} else if (o.textarea) {
		txt.push('<textarea' + o.real_id + ' cols="23" rows="5">' + (o.value || '') + '</textarea>');
	} else if (o.checkbox) {
		txt.push('<input type="checkbox"' + o.real_id + (o.value ? ' checked' : '') + '>');
	} else if (o.button) {
		txt.push('<input type="button"' + o.real_id + ' value="' + o.label + '">');
	} else if (o.select) {
		if (typeof o.select === 'function') {
			o.select = o.select.call(worker, o.id);
		}
		switch (typeof o.select) {
			case 'number':
				step = Divisor(o.select);
				for (i=0; i<=o.select; i+=step) {
					list.push('<option' + (o.value==i ? ' selected' : '') + '>' + i + '</option>');
				}
				break;
			case 'string':
				o.className = ' class="golem_'+o.select+'"';
				if (this.data && this.data[o.select] && (typeof this.data[o.select] === 'array' || typeof this.data[o.select] === 'object')) {
					o.select = this.data[o.select];
				} else {
					break;
				} // deliberate fallthrough
			case 'array':
			case 'object':
				if (isArray(o.select)) {
					for (i=0; i<o.select.length; i++) {
						list.push('<option value="' + o.select[i] + '"' + (o.value==o.select[i] ? ' selected' : '') + '>' + o.select[i] + (o.suffix ? ' '+o.suffix : '') + '</option>');
					}
				} else {
					for (i in o.select) {
						list.push('<option value="' + i + '"' + (o.value==i ? ' selected' : '') + '>' + o.select[i] + (o.suffix ? ' '+o.suffix : '') + '</option>');
					}
				}
				break;
		}
		txt.push('<select' + o.real_id + o.className + o.alt + '>' + list.join('') + '</select>');
	} else if (o.multiple) {
		if (typeof o.value === 'array' || typeof o.value === 'object') {
			for (i in o.value) {
				list.push('<option value="'+o.value[i]+'">'+o.value[i]+'</option>');
			}
		}
		txt.push('<select style="width:100%;clear:both;" class="golem_multiple" multiple' + o.real_id + '>' + list.join('') + '</select><br>');
		if (typeof o.multiple === 'string') {
			txt.push('<input class="golem_select" type="text" size="' + o.size + '">');
		} else {
			list = [];
			switch (typeof o.multiple) {
				case 'number':
					step = Divisor(o.select);
					for (i=0; i<=o.multiple; i+=step) {
						list.push('<option>' + i + '</option>');
					}
					break;
				case 'array':
				case 'object':
					if (isArray(o.multiple)) {
						for (i=0; i<o.multiple.length; i++) {
							list.push('<option value="' + o.multiple[i] + '">' + o.multiple[i] + (o.suffix ? ' '+o.suffix : '') + '</option>');
						}
					} else {
						for (i in o.multiple) {
							list.push('<option value="' + i + '">' + o.multiple[i] + (o.suffix ? ' '+o.suffix : '') + '</option>');
						}
					}
					break;
			}
			txt.push('<select class="golem_select">'+list.join('')+'</select>');
		}
		txt.push('<input type="button" class="golem_addselect" value="Add" /><input type="button" class="golem_delselect" value="Del" />');
	}
	if (o.after) {
		txt.push(' '+o.after);
	}
	if (o.label && (o.text || o.checkbox || o.select || o.multiple)) {
		txt.push('</span>');
	}
	$option = $('<div>' + txt.join('') + '</div>');
	if (o.require) {
		if (typeof o.require === 'string') {
			i = o.require;
			o.require = {};
			o.require[i] = true;
		}
		for (i in o.require) { // Make sure all paths are absolute, "worker.option.key" (option/runtime/data) and all values are in an array
			if (typeof o.require[i] !== 'object') {
				o.require[i] = [o.require[i]];
			}
			if (i.search(/\.(data|option|runtime)\./) === -1) {
				o.require[worker.name + '.option.' + i] = o.require[i];
				delete o.require[i];
			} else if (i.search(/(data|option|runtime)\./) === 0) {
				o.require[worker.name + '.' + i] = o.require[i];
				delete o.require[i];
			}
		}
		$option.addClass('golem-require').attr('require', JSON.stringify(o.require));
	}
	if (o.group) {
		$option.append(this.makeOptions(worker,o.group));
	} else {
		$option.append('<br>');
	}
	if (o.advanced) {
		$option.addClass('golem-advanced');
	}
	if (o.help) {
		$option.attr('title', o.help);
	}
	if (o.advanced || o.exploit) {
		$option.css('background','#ffeeee');
	}
	if (o.advanced && !this.option.advanced) {
		$option.css('display','none');
	}
	if (o.exploit && !this.option.exploit) {
		$option.css('display','none');
	}
	if (o.exploit) {
		$option.css('border','1px solid red');
	}
	return $option;
};

Config.set = function(key, value) {
	this._unflush();
	if (!this.data[key] || JSON.stringify(this.data[key]) !== JSON.stringify(value)) {
		this.data[key] = value;
		$('select.golem_' + key).each(function(a,el){
			var i, worker = WorkerById($(el).closest('div.golem-panel').attr('id')), val = worker ? worker.get(['option', $(el).attr('id').regex(/_([^_]*)$/i)]) : null, list = Config.data[key], options = [];
			if (isArray(list)) {
				for (i=0; i<list.length; i++) {
					options.push('<option value="' + list[i] + '">' + list[i] + '</option>');//' + (val===i ? ' selected' : '') + '
				}
			} else {
				for (i in list) {
					options.push('<option value="' + i + '">' + list[i] + '</option>');//' + (val===i ? ' selected' : '') + '
				}
			}
			$(el).html(options.join('')).val(val);
		});
		this._save();
		return true;
	}
	return false;
};

Config.updateOptions = function() {
//	debug('Options changed');
	// Get order of panels first
	Queue.option.queue = this.getOrder();
	// Now can we see the advanced stuff
	this.option.advanced = $('#golem-config-advanced').attr('checked');
	// Now save the contents of all elements with the right id style
	$('#golem_config :input:not(:button)').each(function(i,el){
		if ($(el).attr('id')) {
			var val, tmp = $(el).attr('id').slice(PREFIX.length).regex(/([^_]*)_(.*)/i);
			if (!tmp) {
				return;
			}
			if ($(el).attr('type') === 'checkbox') {
				val = $(el).attr('checked');
			} else if ($(el).attr('multiple')) {
				val = [];
				$('option', el).each(function(i,el){ val.push($(el).text()); });
			} else {
				val = $(el).attr('value') || ($(el).val() || null);
				if (val && val.search(/[^-0-9.]/) === -1) {
					val = parseFloat(val);
				}
			}
			try {
				WorkerByName(tmp[0]).set('option.'+tmp[1], val);
			} catch(e) {
				debug(e.name + ' in Config.updateOptions(): ' + $(el).attr('id') + '(' + JSON.stringify(tmp) + ') = ' + e.message);
			}
		}
	});
	this.checkRequire();
};

Config.checkRequire = function(selector) {
//	log('checkRequire($("'+(typeof id === 'string' ? '#'+id+' ' : '')+'.golem-require"))');
	if (isWorker(selector)) {
		selector = '#'+selector.id+' .golem-require';
	} else if (typeof selector !== 'undefined' && $(selector).length) {
		selector = $('.golem-require', selector);
	} else {
		selector = '.golem-require';
	}
	$(selector).each(function(a,el){
		var i, j, worker, path, value, show = true, or, require = JSON.parse($(el).attr('require'));
		if ($(el).hasClass('golem-advanced')) {
			show = Config.option.advanced;
		}
		for (i in require) {
			path = i.split('.');
			worker = WorkerByName(path.shift());
			if (!isWorker(worker)) {
				show = false;// Worker doesn't exist - assume it's not a typo, so always hide us...
				break;
			}
			value = worker.get(path,false);
//			{key:[true,true,true], key:[[false,false,false],true,true]} - false is AND, true are OR
			or = [];
			for (j=0; j<require[i].length; j++) {
				if (isArray(require[i][j])) {
					if (findInArray(require[i][j], value)) {
						show = false;
						break;
					}
				} else {
					or.push(require[i][j]);
				}
			}
			if (!show || (or.length && !findInArray(or, value))) {
				show = false;
				break;
			}
		}
		if (show) {
			$(el).show();
		} else {
			$(el).hide();
		}
	});
	for (var i in Workers) {
		Workers[i]._save('option');
	}
};

Config.getOrder = function() {
	var order = [];
	$('#golem_config > div').each(function(i,el){
		order.push($(el).attr('name'));
	});
	return unique(order);
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Dashboard:true, History, Page:true, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Dashboard **********
* Displays statistics and other useful info
*/
var Dashboard = new Worker('Dashboard');

Dashboard.settings = {
//	keep:true
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
	var i, id, tabs = [], divs = [], active = this.option.active;
	for (i in Workers) {
		if (Workers[i].dashboard) {
			id = 'golem-dashboard-'+i;
			if (!active) {
				this.option.active = active = id;
			}
			if (Workers[i] === this) { // Dashboard always comes first with the * tab
				tabs.unshift('<h3 name="'+id+'" class="golem-tab-header' + (active===id ? ' golem-tab-header-active' : '') + '">&nbsp;*&nbsp;</h3>');
			} else {
				tabs.push('<h3 name="'+id+'" class="golem-tab-header' + (active===id ? ' golem-tab-header-active' : '') + '">' + (Workers[i] === this ? '&nbsp;*&nbsp;' : i) + '</h3>');
			}
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
		Dashboard.update('', WorkerByName(Dashboard.option.active.substr(16)));
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
	Dashboard.update('', WorkerByName(Dashboard.option.active.substr(16)));// Make sure we're called at init
	this._revive(1);// update() once every second to update any timers
};

Dashboard.parse = function(change) {
	$('#golem-dashboard').css('top', $('#app'+APPID+'_main_bn').offset().top+'px');
};

Dashboard.update = function(type, worker) {
	if (!worker && type === 'reminder') {
		$('.golem-timer').each(function(i,el){
			var time = $(el).text().parseTimer();
			if (time && time > 0) {
				$(el).text(makeTimer(time - 1));
			} else {
				$(el).removeClass('golem-timer').text('now?');
			}
		});
		$('.golem-time').each(function(i,el){
			var time = parseInt($(el).attr('name'), 10) - Date.now();
			if (time && time > 0) {
				$(el).text(makeTimer(time / 1000));
			} else {
				$(el).removeClass('golem-time').text('now?');
			}
		});
	}
	if (!this._loaded || !worker) { // we only care about updating the dashboard when something we're *watching* changes (including ourselves)
		return;
	}
	if (this.option.active === 'golem-dashboard-'+worker.name && this.option.display === 'block') {
		try {
//			debug('Calling ' + worker.name + '.dashboard() = ' + type);
			worker._unflush();
			worker.dashboard();
		}catch(e) {
			debug(e.name + ' in ' + worker.name + '.dashboard(): ' + e.message);
		}
	} else {
		$('#golem-dashboard-'+worker.name).empty();
	}
};

Dashboard.dashboard = function() {
	this._unflush();
	var i, list = [];
	for (i in Workers) {
		if (this.data[i]) {
			list.push('<tr><th>' + i + ':</th><td id="golem-status-' + i + '">' + this.data[i] + '</td></tr>');
		}
	}
	list.sort(); // Ok with plain text as first thing that can change is name
	$('#golem-dashboard-Dashboard').html('<table cellspacing="0" cellpadding="0" class="golem-status">' + list.join('') + '</table>');
};

Dashboard.status = function(worker, html) {
	this._unflush();
	if (html) {
		this.data[worker.name] = html;
	} else {
		delete this.data[worker.name];
	}
	this._flush();
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Dashboard, History:true, Page, Queue, Resources, Land,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.History **********
* History of anything we want.
* Dashboard is exp, income and bank.
*
* History.set('key', value); - sets the current hour's value
* History.set([hour, 'key'], value); - sets the specified hour's value
* History.add('key', value); - adds to the current hour's value (use negative value to subtract)
* History.add([hour, 'key'], value); - adds to the specified hour's value (use negative value to subtract)
*
* History.get('key') - gets current hour's value
* History.get([hour, 'key', 'maths', 'change', recent_hours]) - 'key' is the only non-optional. Must be in this order. Hour = start hour. Recent_hours is 1-168 and the number of hours to get.
* History.get('key.change') - gets change between this and last value (use for most entries to get relative rather than absolute values)
* History.get('key.average') - gets standard deviated mean average of values (use .change for average of changes etc) - http://en.wikipedia.org/wiki/Arithmetic_mean
* History.get('key.geometric') - gets geometric average of values (use .change for average of changes etc) - http://en.wikipedia.org/wiki/Geometric_mean
* History.get('key.harmonic') - gets harmonic average of values (use .change for average of changes etc) - http://en.wikipedia.org/wiki/Harmonic_mean
* History.get('key.mode') - gets the most common value (use .change again if needed)
* History.get('key.median') - gets the center value if all values sorted (use .change again etc)
* History.get('key.total') - gets total of all values added together
* History.get('key.max') - gets highest value (use .change for highest change in values)
* History.get('key.min') - gets lowest value
*/
var History = new Worker('History');
History.option = null;
History.settings = {
	system:true
};

History.dashboard = function() {
	var list = [];
	list.push('<table cellspacing="0" cellpadding="0" class="golem-graph"><thead><tr><th></th><th colspan="73"><span style="float:left;">&lArr; Older</span>72 Hour History<span style="float:right;">Newer &rArr;</span><th></th></th></tr></thead><tbody>');
	list.push(this.makeGraph(['land', 'income'], 'Income', true, {'Average Income':this.get('land.mean') + this.get('income.mean')}));
	list.push(this.makeGraph('bank', 'Bank', true, Land.runtime.best ? {'Next Land':Land.runtime.cost} : null)); // <-- probably not the best way to do this, but is there a function to get options like there is for data?
	list.push(this.makeGraph('exp', 'Experience', false, {'Next Level':Player.get('maxexp')}));
	list.push(this.makeGraph('exp.change', 'Exp Gain', false, {'Average':this.get('exp.average.change'), 'Standard Deviation':this.get('exp.stddev.change'), 'Ignore entries above':(this.get('exp.mean.change') + (2 * this.get('exp.stddev.change')))} )); // , 'Harmonic Average':this.get('exp.harmonic.change') ,'Median Average':this.get('exp.median.change') ,'Mean Average':this.get('exp.mean.change')
	list.push('</tbody></table>');
	$('#golem-dashboard-History').html(list.join(''));
};

History.update = function(type) {
	var i, hour = Math.floor(Date.now() / 3600000) - 168;
	for (i in this.data) {
		if (i < hour) {
			delete this.data[i];
		}
	}
//	debug('Exp: '+this.get('exp'));
//	debug('Exp max: '+this.get('exp.max'));
//	debug('Exp max change: '+this.get('exp.max.change'));
//	debug('Exp min: '+this.get('exp.min'));
//	debug('Exp min change: '+this.get('exp.min.change'));
//	debug('Exp change: '+this.get('exp.change'));
//	debug('Exp mean: '+this.get('exp.mean.change'));
//	debug('Exp harmonic: '+this.get('exp.harmonic.change'));
//	debug('Exp geometric: '+this.get('exp.geometric.change'));
//	debug('Exp mode: '+this.get('exp.mode.change'));
//	debug('Exp median: '+this.get('exp.median.change'));
//	debug('Average Exp = weighted average: ' + this.get('exp.average.change') + ', mean: ' + this.get('exp.mean.change') + ', geometric: ' + this.get('exp.geometric.change') + ', harmonic: ' + this.get('exp.harmonic.change') + ', mode: ' + this.get('exp.mode.change') + ', median: ' + this.get('exp.median.change'));
};

History.set = function(what, value) {
	if (!value) {
		return;
	}
	this._unflush();
	var hour = Math.floor(Date.now() / 3600000), x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []);
	if (x.length && (typeof x[0] === 'number' || !x[0].regex(/[^0-9]/gi))) {
		hour = x.shift();
	}
	this.data[hour] = this.data[hour] || {};
	this.data[hour][x[0]] = value;
};

History.add = function(what, value) {
	if (!value) {
		return;
	}
	this._unflush();
	var hour = Math.floor(Date.now() / 3600000), x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []);
	if (x.length && (typeof x[0] === 'number' || !x[0].regex(/[^0-9]/gi))) {
		hour = x.shift();
	}
	this.data[hour] = this.data[hour] || {};
	this.data[hour][x[0]] = (this.data[hour][x[0]] || 0) + value;
};

History.math = {
	stddev: function(list) {
		var i, listsum = 0, mean = this.mean(list);
		for (i in list) {
			listsum += Math.pow(list[i] - mean, 2);
		}
		listsum /= list.length;
		return Math.sqrt(listsum);
	},
	average: function(list) {
		var i, mean = this.mean(list), stddev = this.stddev(list);
		for (i in list) {
			if (Math.abs(list[i] - mean) > stddev * 2) { // The difference between the mean and the entry needs to be in there.
				delete list[i];
			}
		}
		return sum(list) / list.length;
	},
	mean: function(list) {
		return sum(list) / list.length;
	},
	harmonic: function(list) {
		var i, num = [];
		for (i in list) {
			if (list[i]) {
				num.push(1/list[i]);
			}
		}
		return num.length / sum(num);
	},
	geometric: function(list) {
		var i, num = 1;
		for (i in list) {
			num *= list[i] || 1;
		}
		return Math.pow(num, 1 / list.length);
	},
	median: function(list) {
		list.sort(function(a,b){return a-b;});
		if (list.length % 2) {
			return (list[Math.floor(list.length / 2)] + list[Math.ceil(list.length / 2)]) / 2;
		}
		return list[Math.floor(list.length / 2)];
	},
	mode: function(list) {
		var i, j = 0, count = 0, num = {};
		for (i in list) {
			num[list[i]] = (num[list[i]] || 0) + 1;
		}
		num = sortObject(num, function(a,b){return num[b]-num[a];});
		for (i in num) {
			if (num[i] === num[0]) {
				j += parseInt(num[i], 10);
				count++;
			}
		}
		return j / count;
	},
	max: function(list) {
		list.sort(function(a,b){return b-a;});
		return list[0];
	},
	min: function(list) {
		list.sort(function(a,b){return a-b;});
		return list[0];
	}
};

History.get = function(what) {
	this._unflush();
	var i, j, value, last = null, list = [], data = this.data, x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []), hour = Math.floor(Date.now() / 3600000), exact = false, past = 168, change = false;
	if (x.length && (typeof x[0] === 'number' || !x[0].regex(/[^0-9]/gi))) {
		hour = x.shift();
	}
	if (x.length && (typeof x[x.length-1] === 'number' || !x[x.length-1].regex(/[^0-9]/gi))) {
		past = Math.range(1, parseInt(x.pop(), 10), 168);
	}
	if (!x.length) {
		return data;
	}
	for (i in data) {
		if (typeof data[i][x[0]] === 'number') {
			exact = true;
			break;
		}
	}
	if (x.length === 1) { // only the current value
		if (exact) {
			return data[hour][x[0]];
		}
		for (j in data[hour]) {
			if (j.indexOf(x[0] + '+') === 0 && typeof data[hour][j] === 'number') {
				value = (value || 0) + data[hour][j];
			}
		}
		return value;
	}
	if (x.length === 2 && x[1] === 'change') {
		if (data[hour] && data[hour-1]) {
			i = this.get([hour, x[0]]);
			j = this.get([hour - 1, x[0]]);
			if (typeof i === 'number' && typeof j === 'number') {
				return i - j;
			}
			return 0;
		}
		return 0;
	}
	if (x.length > 2 && x[2] === 'change') {
		change = true;
	}
	for (i=hour-past; i<=hour; i++) {
		if (data[i]) {
			value = null;
			if (exact) {
				if (typeof data[i][x[0]] === 'number') {
					value = data[i][x[0]];
				}
			} else {
				for (j in data[i]) {
					if (j.indexOf(x[0] + '+') === 0 && typeof data[i][j] === 'number') {
						value = (value || 0) + data[i][j];
					}
				}
			}
			if (change) {
				if (value !== null && last !== null) {
					list.push(value - last);
					if (isNaN(list[list.length - 1])) {
						debug('NaN: '+value+' - '+last);
					}
				}
				last = value;
			} else {
				if (value !== null) {
					list.push(value);
				}
			}
		}
	}
	if (History.math[x[1]]) {
		return History.math[x[1]](list);
	}
	throw('Wanting to get unknown History type ' + x[1] + ' on ' + x[0]);
};

History.getTypes = function(what) {
	var i, list = [], types = {}, data = this.data, x = what + '+';
	for (i in data) {
		if (i.indexOf(x) === 0) {
			types[i] = true;
		}
	}
	for (i in types) {
		list.push(i);
	}
	return list;
};

History.makeGraph = function(type, title, iscash, goal) {
	var i, j, count, min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY, max_s, min_s, goal_s = [], list = [], bars = [], output = [], value = {}, goalbars = '', divide = 1, suffix = '', hour = Math.floor(Date.now() / 3600000), numbers;
	if (typeof goal === 'number') {
		goal = [goal];
	} else if (typeof goal !== 'array' && typeof goal !== 'object') {
		goal = null;
	}
	if (goal && length(goal)) {
		for (i in goal) {
			min = Math.min(min, goal[i]);
			max = Math.max(max, goal[i]);
		}
	}
	if (typeof type === 'string') {
		type = [type];
	}
	for (i=hour-72; i<=hour; i++) {
		value[i] = [0];
		if (this.data[i]) {
			for (j in type) {
				value[i][j] = this.get(i + '.' + type[j]);
			}
			if (sum(value[i])) {min = Math.min(min, sum(value[i]));}
			max = Math.max(max, sum(value[i]));
		}
	}
	if (max >= 1000000000) {
		divide = 1000000000;
		suffix = 'b';
	} else if (max >= 1000000) {
		divide = 1000000;
		suffix = 'm';
	} else if (max >= 1000) {
		divide = 1000;
		suffix = 'k';
	}
	max = Math.ceil(max / divide) * divide;
	max_s = (iscash ? '$' : '') + addCommas(max / divide) + suffix;
	min = Math.floor(min / divide) * divide;
	min_s = (iscash ? '$' : '') + addCommas(min / divide) + suffix;
	if (goal && length(goal)) {
		for (i in goal) {
			bars.push('<div style="bottom:' + Math.max(Math.floor((goal[i] - min) / (max - min) * 100), 0) + 'px;"></div>');
			goal_s.push('<div' + (typeof i !== 'number' ? ' title="'+i+'"' : '') + ' style="bottom:' + Math.range(2, Math.ceil((goal[i] - min) / (max - min) * 100)-2, 92) + 'px;">' + (iscash ? '$' : '') + addCommas((goal[i] / divide).round(1)) + suffix + '</div>');
		}
		goalbars = '<div class="goal">' + bars.reverse().join('') + '</div>';
		goal_s.reverse();
	}
	th(list, '<div>' + max_s + '</div><div>' + title + '</div><div>' + min_s + '</div>');
	for (i=hour-72; i<=hour; i++) {
		bars = [];
		output = [];
		numbers = [];
		title = (hour - i) + ' hour' + ((hour - i)===1 ? '' : 's') +' ago';
		count = 0;
		for (j in value[i]) {
			bars.push('<div style="height:' + Math.max(Math.ceil(100 * (value[i][j] - (!count ? min : 0)) / (max - min)), 0) + 'px;"></div>');
			count++;
			if (value[i][j]) {
				numbers.push((value[i][j] ? (iscash ? '$' : '') + addCommas(value[i][j]) : ''));
			}
		}
		output.push('<div class="bars">' + bars.reverse().join('') + '</div>' + goalbars);
		numbers.reverse();
		title = title + (numbers.length ? ', ' : '') + numbers.join(' + ') + (numbers.length > 1 ? ' = ' + (iscash ? '$' : '') + addCommas(sum(value[i])) : '');
		td(list, output.join(''), 'title="' + title + '"');
	}
	th(list, goal_s.join(''));
	return '<tr>' + list.join('') + '</tr>';
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page:true, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Page() **********
* All navigation including reloading
*/
var Page = new Worker('Page');

Page.settings = {
	system:true,
	unsortable:true,
	keep:true
};

Page.option = {
	timeout:15,
	delay:1,
	reload:5,
	nochat:false,
	click:true
};

Page.page = '';
Page.lastclick = null;
Page.when = null;
Page.retry = 0; // Number of times we tried
Page.node_trigger = null;
Page.loading = false;

Page.display = [
	{
		id:'timeout',
		label:'Retry after',
		select:[10, 15, 30, 60],
		after:'seconds'
	},{
		id:'delay',
		label:'...Delay',
		select:[1, 2, 3, 4, 5],
		after:'seconds'
	},{
		id:'reload',
		label:'Reload after',
		select:[3, 5, 7, 9, 11, 13, 15],
		after:'tries'
	},{
		id:'nochat',
		label:'Remove Facebook Chat',
		checkbox:true,
		help:'This does not log you out of chat, only hides it from display and attempts to stop it loading - you can still be online in facebook'
	},{
		id:'click',
		label:'Replace Links',
		checkbox:true,
		help:'Uses Golem code for clicking on links rather than facebook code - may help with some white screen issues'
	}
];

Page.defaults = {
	'castle_age':{
		pageNames:{
//			facebook:				- not real, but used in worker.pages for worker.parse('facebook') on fb popup dialogs
			index:					{url:'index.php', selector:'#app'+APPID+'_indexNewFeaturesBox'},
			quests_quest:			{url:'quests.php', image:'tab_quest_on.gif'}, // If we ever get this then it means a new land...
			quests_quest1:			{url:'quests.php?land=1', image:'land_fire_sel.gif'},
			quests_quest2:			{url:'quests.php?land=2', image:'land_earth_sel.gif'},
			quests_quest3:			{url:'quests.php?land=3', image:'land_mist_sel.gif'},
			quests_quest4:			{url:'quests.php?land=4', image:'land_water_sel.gif'},
			quests_quest5:			{url:'quests.php?land=5', image:'land_demon_realm_sel.gif'},
			quests_quest6:			{url:'quests.php?land=6', image:'land_undead_realm_sel.gif'},
			quests_quest7:			{url:'quests.php?land=7', image:'tab_underworld_big.gif'},
			quests_quest8:			{url:'quests.php?land=8', image:'tab_heaven_big2.gif'},
			quests_quest9:			{url:'quests.php?land=9', image:'tab_ivory_big.gif'},
			quests_demiquests:		{url:'symbolquests.php', image:'demi_quest_on.gif'},
			quests_atlantis:		{url:'monster_quests.php', image:'tab_atlantis_on.gif'},
			battle_battle:			{url:'battle.php', image:'battle_on.gif'},
			battle_training:		{url:'battle_train.php', image:'training_grounds_on_new.gif'},
			battle_rank:			{url:'battlerank.php', image:'tab_battle_rank_on.gif'},
			battle_raid:			{url:'raid.php', image:'tab_raid_on.gif'},
			battle_arena:			{url:'arena.php', image:'tab_arena_on.gif'},
			battle_war_council:		{url:'war_council.php', image:'war_select_banner.jpg'},
			monster_monster_list:	{url:'battle_monster.php', image:'tab_monster_list_on.gif'},
			monster_battle_monster:	{url:'battle_monster.php', selector:'div[style*="nm_monster_list_button.gif"]'},
			keep_monster_active:	{url:'raid.php', image:'dragon_view_more.gif'},
			monster_summon:			{url:'monster_summon_list.php', image:'tab_summon_monster_on.gif'},
			monster_class:			{url:'view_class_progress.php', selector:'#app'+APPID+'_choose_class_header'},
			heroes_heroes:			{url:'mercenary.php', image:'tab_heroes_on.gif'},
			heroes_generals:		{url:'generals.php', image:'tab_generals_on.gif'},
			town_soldiers:			{url:'soldiers.php', image:'tab_soldiers_on.gif'},
			town_blacksmith:		{url:'item.php', image:'tab_black_smith_on.gif'},
			town_magic:				{url:'magic.php', image:'tab_magic_on.gif'},
			town_land:				{url:'land.php', image:'tab_land_on.gif'},
			oracle_oracle:			{url:'oracle.php', image:'oracle_on.gif'},
			oracle_demipower:		{url:'symbols.php', image:'demi_on.gif'},
			oracle_treasurealpha:	{url:'treasure_chest.php', image:'tab_treasure_alpha_on.gif'},
			oracle_treasurevanguard:{url:'treasure_chest.php?treasure_set=alpha', image:'tab_treasure_vanguard_on.gif'},
			oracle_treasureonslaught:{url:'treasure_chest.php?treasure_set=onslaught', image:'tab_treasure_onslaught_on.gif'},
			keep_stats:				{url:'keep.php', image:'tab_stats_on.gif'},
			keep_eliteguard:		{url:'party.php', image:'tab_elite_guard_on.gif'},
			keep_achievements:		{url:'achievements.php', image:'tab_achievements_on.gif'},
			keep_alchemy:			{url:'alchemy.php', image:'tab_alchemy_on.gif'},
			army_invite:			{url:'army.php', image:'invite_on.gif'},
			army_gifts:				{url:'gift.php', selector:'#app'+APPID+'_giftContainer'},
			army_viewarmy:			{url:'army_member.php', image:'view_army_on.gif'},
			army_sentinvites:		{url:'army_reqs.php', image:'sent_invites_on.gif'},
			army_newsfeed:			{url:'army_news_feed.php', selector:'#app'+APPID+'_army_feed_header'},
			gift_accept:			{url:'gift_accept.php', selector:'div[style*="gift_background.jpg"]'},
			apprentice_collect:		{url:'apprentice.php?collect=true', image:'ma_view_progress2.gif'}
		}
	}
};

Page.removeFacebookChat = function() {
	$('script').each(function(i,el){
		$(el).text($(el).text()
		.replace(/\nonloadRegister.function \(\).*new ChatNotifications.*/g, '')
		.replace(/\n<script>big_pipe.onPageletArrive.{2}"id":"pagelet_chat_home".*/g, '')
		.replace(/\n<script>big_pipe.onPageletArrive.{2}"id":"pagelet_presence".*/g, '')
		.replace(/|chat\\\//,''))
	});
	var b = document.getElementsByTagName('body')[0] || document.documentElement, a = document.createElement('script');
	a.type = 'text/javascript';
	a.appendChild(document.createTextNode('window.setTimeout(function(){window.presenceNotifications=null;},1000);'));
	b.appendChild(a);
	$('#pagelet_presence').remove();
	$('#pagelet_chat_home').remove();
};

Page.replaceClickHandlers = function() {
	// Remove all CA click handlers...
	$('#app'+APPID+'_globalContainer a[href*="/'+APP+'/"]')
	.click(function(event){
		if (event.which === 1 && $(this).attr('href') && !Page.to($(this).attr('href'), false)) {// Left click only
			debug('Replacing CA link');
			event.preventDefault();
			event.stopImmediatePropagation()
			return false;
		}
		return true;
	});
};

Page.init = function() {
	// Only perform the check on the two id's referenced in get_cached_ajax()
	// Give a short delay due to multiple children being added at once, 0.1 sec should be more than enough
	$('body').bind('DOMNodeInserted', function(event){
		if (($(event.target).attr('id') === 'app'+APPID+'_app_body_container' || $(event.target).attr('id') === 'app'+APPID+'_globalContainer')) {
			window.clearTimeout(Page.node_trigger);
			Page.node_trigger = window.setTimeout(function(){Page.node_trigger=null;Page.parse_all(false);},100);// Normal game stuff
		} else if ($(event.target).hasClass('generic_dialog_popup')) {
//		} else if ($(event.target).attr('id') === 'pop_content') {
			window.clearTimeout(Page.node_trigger);
			Page.node_trigger = window.setTimeout(function(){Page.node_trigger=null;Page.parse_all(true);},100);// Facebook popup display
		}
	});
	if (this.option.nochat) {
		this.removeFacebookChat();
	}
	if (this.option.click) {
		$('#app'+APPID+'_globalContainer a[href*="/'+APP+'/"][onlick]').each(function(i,el){
			$(el).parent().html($(el).parent().html().replace(/<a onclick="[^"]*" href/g, '<a href'));
		});
		this.replaceClickHandlers();
	}
};

Page.parse_all = function(isFacebook) {
	this._push();
	if (!isFacebook) {
		Page.identify();
	}
	var i, list = [];
	for (i in Workers) {
		if (Workers[i].parse && Workers[i].pages) {
			if (isFacebook) {
				if (Workers[i].pages.indexOf('facebook') >= 0) {
					Workers[i]._unflush();
					Workers[i]._parse('facebook');
				}
			} else if (Workers[i].pages.indexOf('*') >= 0 || (Page.page !== '' && Workers[i].pages.indexOf(Page.page) >= 0)) {
				Workers[i]._unflush();
				if (Workers[i]._parse(false)) {
					list.push(Workers[i]);
				}
			}
		}
	}
	for (i in list) {
		list[i]._parse(true);
	}
	for (i in Workers) {
		Workers[i]._flush();
	}
	this._pop();
};

Page.work = function(state) {
	var i, l, list, found = null;
	for (i in Workers) {
		if (isString(Workers[i].pages)) {
			list = Workers[i].pages.split(' ');
			for (l=0; l<list.length; l++) {
				if (list[l] !== '*' && this.pageNames[list[l]] && !this.data[list[l]] && list[l].indexOf('_active') === -1) {
					found = list[l];
					break;
				}
			}
		}
		if (found) {
			break;
		}
	}
	if (found) {
		if (!state) {
			return QUEUE_CONTINUE;
		}
		if (!this.to(found)) {
			this.data[found] = Date.now(); // Even if it's broken, we need to think we've been there!
			return QUEUE_CONTINUE;
		}
	}
	this.work = null;// Only check when first loading, once we're running we never work() again :-P
	return QUEUE_FINISH;
};

Page.identify = function() {
	this.page = '';
	if (!$('#app_content_'+APPID+' > div > div').length || !$('#app'+APPID+'_globalContainer > div > div').length) {
		debug('Page apparently not loaded correctly, reloading.');
		this.reload();
		return null;
	}
	this.clear();
	var app_body = $('#app'+APPID+'_app_body'), p;
	$('img', app_body).each(function(i,el){
		var p, filename = $(el).attr('src').filepart();
		for (p in Page.pageNames) {
			if (Page.pageNames[p].image && filename === Page.pageNames[p].image) {
				Page.page = p;
				return;
			}
		}
	});
	if (!this.page) {
		for (p in Page.pageNames) {
			if (Page.pageNames[p].selector && $(Page.pageNames[p].selector).length) {
				Page.page = p;
			}
		}
	}
	if (this.page !== '') {
		this.data[this.page] = Date.now();
	}
//	debug('this.identify("'+Page.page+'")');
	return this.page;
};

Page.request = {method:'GET', url:null, body:null}

Page.onreadystatechange = function() {
	if (this.readyState !== 4) {
		return;
	}
	try {
		// First check it's there, and an html page
		if (this.status !== 200 || !this.responseText || this.responseText.indexOf('</html>') === -1) {
			throw(this.status===200 ? 'Bad response status' : 'Bad data');
		}
		// Reduce it to just the stuff we want...
		var data = this.responseText.substring(this.responseText.indexOf('<div id="app'+APPID+'_globalContainer"'), this.responseText.indexOf('<div class="UIStandardFrame_SidebarAds"'));
		// Then check if it's still valid
		if (!data // || data.indexOf(APP) === -1
		|| data.indexOf('app'+APPID+'_results_container') === -1
		|| data.indexOf('app'+APPID+'_main_bntp') === -1
		|| data.indexOf('app'+APPID+'_app_body') === -1) {
			throw('Bad data');
		}
// Last things in source if loaded correctly...
		try {// Once we're here we want to complete...
			if (Page.option.nochat) {
				data = data.replace(/\nonloadRegister.function \(\).*new ChatNotifications.*/g, '').replace(/\n<script>big_pipe.onPageletArrive.{2}"id":"pagelet_chat_home".*/g, '').replace(/\n<script>big_pipe.onPageletArrive.{2}"id":"pagelet_presence".*/g, '').replace(/|chat\\\//,'');
			}
			if (Page.option.click) {
//				debug('replacing click handlers');
				data = data.replace(/<a onclick="[^"]*" href/g, '<a href');
			}
			$('#app'+APPID+'_AjaxLoadIcon').hide();
			$('#app'+APPID+'_globalContainer').replaceWith(data);
			Page.clear();
			if (Page.option.click) {
				Page.replaceClickHandlers();
			}
		} catch(e1){
			debug(e1.name + ' in XMLHttpRequest('+(Page.request.method || 'GET')+', '+Page.request.url+'): ' + e1.message);
		}
		return;// Stop here as we're done
	} catch(e2){
		debug('AJAX_BAD_REPLY in XMLHttpRequest('+(Page.request.method || 'GET')+', '+Page.request.url+'): ' + e2);
	}
	if (++Page.retry < Page.option.retry && Page.request.url) {
		debug('Page not loaded correctly, retry last action.');
		window.setTimeout(function(){
			var request = new XMLHttpRequest();
			request.open(Page.request.method || 'GET', Page.request.url);
			request.onreadystatechange = Page.onreadystatechange;
			request.send(Page.request.body);
		}, Page.option.delay * 1000);
	} else {
		debug('Page not loaded correctly, reloading.');
		window.setTimeout(Page.reload, Page.option.delay * 1000);
	}
};

/*
Page.to(['GET' | 'POST',] 'index', ['args' | {arg1:val, arg2:val},] [true|false]
*/
Page.to = function() { // Force = true/false (ignore pause and reload page if true)
	var i, j, method = 'GET', page, body, args, force = 0, request;
	for (i=0; i<arguments.length; i++) {
		switch (typeof arguments[i]) {
			case 'string':
				if (arguments[i].toUpperCase() === 'GET' || arguments[i].toUpperCase() === 'POST') {
					method = arguments[i].toUpperCase();
				} else if (!page) {
					if (arguments[i].indexOf('apps.facebook.com/' + APP + '/') !== -1) {
						for (j in Page.pageNames) {
							if (arguments[i].indexOf('/'+Page.pageNames[j].url) !== -1) {
								page = j;
								args = arguments[i].indexOf('?')>=0 ? arguments[i].substr(arguments[i].indexOf('?')) : '';
							}
						}
					} else {
						page = arguments[i];
					}
				} else {
					if (method === 'GET') {
						args = (arguments[i].indexOf('?') !== 0 ? '?' : '') + arguments[i];
					} else {
						body = arguments[i];
					}
				}
				break;
			case 'boolean':
				force = arguments[i];
				break;
			case 'object':
				if (arguments[i] !== null) {
					if (method === 'GET') {
						args = '?' + decodeURIComponent($.param(arguments[i]));
					} else {
						body = decodeURIComponent($.param(arguments[i]));
					}
				}
				break;
			default:
				break;
		}
	}
//	debug('Page.to("'+method+'", "'+page+'", "'+args+'", '+force+');');
	if (force === 0 && Queue.option.pause) {
		debug('Trying to load page when paused...');
		return true;
	}
	if (page === this.page && method !== 'POST' && (force || typeof args === 'undefined')) {
		return true;
	}
//	this._push();
	if (page && this.pageNames[page] && this.pageNames[page].url) {
		this.clear();
		page = window.location.protocol + '//apps.facebook.com/' + APP + '/' + this.pageNames[page].url;
		this.when = Date.now();
		if (method === 'GET' && args) {
			if (page.indexOf('?') > 0) {
				page = page.substr(0, page.indexOf('?'));
			}
			page = page + args;
		}
		debug('Navigating to ' + page + (force ? ' (FORCE)' : ''));
		if (force) {
			window.location.replace(page);// Load new page without giving a back button
		} else {
			Page.request = {
				method:method,
				url:page,
				body:body
			};
			request = new XMLHttpRequest();
			request.open(method, page);
			request.onreadystatechange = Page.onreadystatechange;
			request.send(body);
			this.loading = true;
			setTimeout(function() { if (Page.loading) {$('#app'+APPID+'_AjaxLoadIcon').show();} }, 1500);
		}
	}
//	this._pop();
	return false;
};

Page.reload = function() {
	debug('Page.reload()');
	window.location.replace(window.location.href);
};

Page.clearFBpost = function(obj) {
	var output = [];
	for (var i=0; i<obj.length; i++) {
		if (obj[i].name.indexOf('fb_') !== 0) {
			output.push(obj[i]);
		}
	}
	if (!output.bqh && $('input[name=bqh]').length) {
		output.push({name:'bqh', value:$('input[name=bqh]').first().val()});
	}
	return output;
};

Page.click = function(el) {
	if (!$(el).length) {
		log('Page.click: Unable to find element - '+el);
		return false;
	}
	if (this.lastclick === el) {
		if (++this.retry >= this.option.retry) {
			debug('Element not clicked properly, reloading.');
			Page.reload();
			return true;
		}
	} else {
		this.clear();
	}
	var e, element = $(el).get(0);
	e = document.createEvent("MouseEvents");
	e.initEvent("click", true, true);
	(element.wrappedJSObject ? element.wrappedJSObject : element).dispatchEvent(e);
	this.lastclick = el;
	this.when = Date.now();
	return true;
};
/*
post: http://apps.facebook.com/fbml/fbjs_ajax_proxy.php?__a=1
body:
appid=46755028429&fb_dtsg=fpDLt&fb_mockajax_context=O%3A16%3A%22CanvasFBMLFlavor%22%3A1%3A%7Bs%3A9%3A%22_fbml_env%22%3Ba%3A11%3A%7Bs%3A4%3A%22user%22%3Bi%3A1007243850%3Bs%3A6%3A%22app_id%22%3Bi%3A46755028429%3Bs%3A10%3A%22fb_page_id%22%3Bi%3A0%3Bs%3A10%3A%22canvas_url%22%3Bs%3A44%3A%22http%3A%2F%2Fapps.facebook.com%2Fcastle_age%2Fkeep.php%22%3Bs%3A10%3A%22source_url%22%3Bs%3A44%3A%22http%3A%2F%2Fweb.castleagegame.com%2Fcastle%2Fkeep.php%22%3Bs%3A9%3A%22loggedout%22%3Bb%3A0%3Bs%3A7%3A%22non-tos%22%3Bb%3A0%3Bs%3A11%3A%22flavor_code%22%3Bi%3A3%3Bs%3A14%3A%22on_canvas_info%22%3Bb%3A1%3Bs%3A8%3A%22is_tosed%22%3Bb%3A1%3Bs%3A8%3A%22fb_frame%22%3Bs%3A10%3A%22castle_age%22%3B%7D%7D&fb_mockajax_context_hash=9819cf66eab1&post_form_id=54f38dee5adaf1e060a9b776075d9d8f&post_form_id_source=AsyncRequest&query%5Bajax%5D=1&query%5Bconsume%5D=true&query%5Bitem%5D=2&require_login=1&type=2&url=http%3A%2F%2F75.126.76.167%2Fcastle%2Fkeep.php

appid				46755028429
fb_dtsg				fpDLt
fb_mockajax_context	O:16:"CanvasFBMLFlavor":1:{s:9:"_fbml_env";a:11:{s:4:"user";i:0000000000;s:6:"app_id";i:46755028429;s:10:"fb_page_id";i:0;s:10:"canvas_url";s:44:"http://apps.facebook.com/castle_age/keep.php";s:10:"source_url";s:44:"http://web.castleagegame.com/castle/keep.php";s:9:"loggedout";b:0;s:7:"non-tos";b:0;s:11:"flavor_code";i:3;s:14:"on_canvas_info";b:1;s:8:"is_tosed";b:1;s:8:"fb_frame";s:10:"castle_age";}}
fb_mockajax_context_hash	9819cf66eab1
post_form_id		54f38dee5adaf1e060a9b776075d9d8f
post_form_id_source	AsyncRequest
query[ajax]			1
query[consume]		true
query[item]			2
require_login		1
type				2
url	http://75.126.76.167/castle/keep.php

form: [{"name":"fb_sig_locale","value":"en_GB"},{"name":"fb_sig_in_new_facebook","value":"1"},{"name":"fb_sig_time","value":"1278556687.3793"},{"name":"fb_sig_added","value":"1"},{"name":"fb_sig_profile_update_time","value":"1271859747"},{"name":"fb_sig_expires","value":"1278561600"},{"name":"fb_sig_user","value":"????"},{"name":"fb_sig_session_key","value":"2.KV3i0YLvQndJ1JS06uBLKw__.3600.1278561600-???"},{"name":"fb_sig_ext_perms","value":"status_update,photo_upload,video_upload,email,create_note,share_item,publish_stream"},{"name":"fb_sig_country","value":"bg"},{"name":"fb_sig_api_key","value":"b455181a07582e4d54eab065dbd4f706"},{"name":"fb_sig_app_id","value":"46755028429"},{"name":"fb_sig","value":"633bfeeeb79d92c2c38dfee81067fd0d"},{"name":"consume","value":"true"},{"name":"item","value":"2"},{"name":"ajax","value":"1"}]

	$form = $(el).parents('form:first');
	if ($form.length) {
		debug('Sending in form: '+($form.attr('method') || 'GET')+' '+Page.page+' = '+JSON.stringify($form.serializeArray()));
		Page.to(Page.page, this.clearFBpost($form.serializeArray()));
	}
*/

Page.clear = function() {
	this.lastclick = this.when = null;
	this.loading = false;
	this.retry = 0;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue:true, Resources, Window,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Queue() **********
* Keeps track of the worker queue
*/
var Queue = new Worker('Queue', '*');
Queue.data = null;

// worker.work() return values for stateful - ie, only let other things interrupt when it's "safe"
var QUEUE_FINISH	= 0;// Finished everything, let something else work
var QUEUE_CONTINUE	= 1;// Not finished at all, don't interrupt
var QUEUE_RELEASE	= 2;// Not quite finished, but safe to interrupt 
// worker.work() can also return true/false for "continue"/"finish" - which means they can be interrupted at any time

Queue.settings = {
	system:true,
	unsortable:true,
	keep:true
};

Queue.runtime = {
	current:null
};

Queue.option = {
	delay: 5,
	clickdelay: 5,
	queue: ['Page', 'Resources', 'Queue', 'Settings', 'Title', 'Income', 'LevelUp', 'Elite', 'Quest', 'Monster', 'Battle', 'Arena', 'Heal', 'Land', 'Town', 'Bank', 'Alchemy', 'Blessing', 'Gift', 'Upgrade', 'Potions', 'Army', 'Idle'],//Must match worker names exactly - even by case
	enabled: {},// Automatically filled with everything anyway...
	start_stamina: 0,
	stamina: 0,
	start_energy: 0,
	energy: 0,
	pause: false
};

Queue.display = [
	{
		label:'Drag the unlocked panels into the order you wish them run.'
	},{
		id:'delay',
		label:'Delay Between Events',
		text:true,
		after:'secs',
		size:3
	},{
		id:'clickdelay',
		label:'Delay After Mouse Click',
		text:true,
		after:'secs',
		size:3,
		help:'This should be a multiple of Event Delay'
	},{
		id:'stamina',
		before:'Keep',
		select:'stamina',
		after:'Stamina Always'
	},{
		id:'start_stamina',
		before:'Stock Up',
		select:'stamina',
		after:'Stamina Before Using'
	},{
		id:'energy',
		before:'Keep',
		select:'energy',
		after:'Energy Always'
	},{
		id:'start_energy',
		before:'Stock Up',
		select:'energy',
		after:'Energy Before Using'
	}
];

Queue.runfirst = [];
Queue.lastclick = Date.now();	// Last mouse click - don't interrupt the player
Queue.lastrun = Date.now();		// Last time we ran
Queue.burn = {stamina:false, energy:false};
Queue.timer = null;

Queue.lasttimer = -1;

Queue.init = function() {
	var i, $btn, worker;
	this._watch(Player);
	this.option.queue = unique(this.option.queue);
	for (i in Workers) {// Add any new workers that have a display (ie, sortable)
		if (Workers[i].work && Workers[i].display && !findInArray(this.option.queue, i)) {
			log('Adding '+i+' to Queue');
			if (Workers[i].settings.unsortable) {
				this.option.queue.unshift(i);
			} else {
				this.option.queue.push(i);
			}
		}
	}
	for (i=0; i<this.option.queue.length; i++) {// Then put them in saved order
		worker = Workers[this.option.queue[i]];
		if (worker && worker.display) {
			if (this.runtime.current && worker.name === this.runtime.current) {
				debug('Trigger '+worker.name+' (continue after load)');
				$('#'+worker.id+' > h3').css('font-weight', 'bold');
			}
			$('#golem_config').append($('#'+worker.id));
		}
	}
	$(document).bind('click keypress', function(event){
		if (!event.target || !$(event.target).parents().is('#golem_config_frame,#golem-dashboard')) {
			Queue.lastclick=Date.now();
		}
	});
	$btn = $('<img class="golem-button' + (this.option.pause?' red':' green') + '" id="golem_pause" src="' + (this.option.pause ? Images.play : Images.pause) + '">').click(function() {
		Queue.option.pause = !Queue.option.pause;
		debug('State: ' + (Queue.option.pause ? "paused" : "running"));
		$(this).toggleClass('red green').attr('src', (Queue.option.pause ? Images.play : Images.pause));
		Page.clear();
		Queue.clearCurrent();
		Config.updateOptions();
	});
	$('#golem_buttons').prepend($btn); // Make sure it comes first
	// Running the queue every second, options within it give more delay
};

Queue.clearCurrent = function() {
	var current = this.get('runtime.current', null);
	if (current) {
		$('#'+Workers[current].id+' > h3').css('font-weight', 'normal');
		this.set('runtime.current', null);// Make sure we deal with changed circumstances
	}
};

Queue.update = function(type,worker) {
	var i, $worker, worker, current, result, now = Date.now(), next = null, release = false;
	if (!type || type === 'option') { // options have changed
		if (this.option.pause) {
			this._forget('run');
			this.lasttimer = -1;
		} else if (this.option.delay !== this.lasttimer) {
			this._revive(this.option.delay, 'run');
			this.lasttimer = this.option.delay;
		}
		for (i in Workers) {
			$worker = $('#'+Workers[i].id+' .golem-panel-header');
			if (Queue.enabled(Workers[i])) {
				if ($worker.hasClass('red')) {
					$worker.removeClass('red');
					Workers[i]._update('option', null);
				}
			} else {
				if (!$worker.hasClass('red')) {
					$worker.addClass('red');
					Workers[i]._update('option', null);
				}
			}
		}
	}
	if (!type || type === 'runtime') { // runtime has changed - only care if the current worker isn't enabled any more
		if (this.runtime.current && !this.get(['option', 'enabled', this.runtime.current], true)) {
			this.clearCurrent();
		}
	}
	if (type === 'reminder') { // This is where we call worker.work() for everyone
		if ((isWorker(Window) && !Window.active) // Disabled tabs don't get to do anything!!!
		|| now - this.lastclick < this.option.clickdelay * 1000 // Want to make sure we delay after a click
		|| Page.loading) { // We want to wait xx seconds after the page has loaded
			return;
		}
		this.burn.stamina = this.burn.energy = 0;
		if (this.option.burn_stamina || Player.get('stamina') >= this.option.start_stamina) {
			this.burn.stamina = Math.max(0, Player.get('stamina') - this.option.stamina);
			this.option.burn_stamina = this.burn.stamina > 0;
		}
		if (this.option.burn_energy || Player.get('energy') >= this.option.start_energy) {
			this.burn.energy = Math.max(0, Player.get('energy') - this.option.energy);
			this.option.burn_energy = this.burn.energy > 0;
		}
		this._push();
//		debug('Start Queue, Stamina: ' + this.burn.stamina +', Energy: ' + this.burn.energy);
		
		// We don't want to stay at max any longer than we have to because it is wasteful.  Burn a bit to start the countdown timer.
	/*	if (Player.get('energy') >= Player.get('maxenergy')){
			this.burn.stamina = 0;	// Focus on burning energy
			debug('At max energy, burning energy first.');
		} else if (Player.get('stamina') >= Player.get('maxstamina')){
			this.burn.energy = 0;	// Focus on burning stamina
			debug('At max stamina, burning stamina first.');
		}
	*/	
		for (i in Workers) { // Run any workers that don't have a display, can never get focus!!
			if (Workers[i].work && !Workers[i].display && this.enabled(Workers[i])) {
				debug(Workers[i].name + '.work(false);');
				Workers[i]._unflush();
				Workers[i]._work(false);
			}
		}
		for (i=0; i<this.option.queue.length; i++) {
			worker = Workers[this.option.queue[i]];
			if (!worker || !worker.work || !worker.display || !this.enabled(worker)) {
				continue;
			}
//			debug(worker.name + '.work(' + (this.runtime.current === worker.name) + ');');
			if (this.runtime.current === worker.name) {
				worker._unflush();
				result = worker._work(true);
				if (result === QUEUE_RELEASE) {
					release = true;
				} else if (!result) {// false or QUEUE_FINISH
					this.runtime.current = null;
					if (worker.id) {
						$('#'+worker.id+' > h3').css('font-weight', 'normal');
					}
//					debug('End '+worker.name);
				}
			} else {
				result = worker._work(false);
			}
			if (!worker.settings.stateful && typeof result !== 'boolean') {// QUEUE_* are all numbers
				worker.settings.stateful = true;
			}
			if (!next && result) {
				next = worker; // the worker who wants to take over
			}
		}
		current = this.runtime.current ? Workers[this.runtime.current] : null;
		if (next !== current && (!current || !current.settings.stateful || next.settings.important || release)) {// Something wants to interrupt...
			if (current) {
				debug('Interrupt ' + current.name + ' with ' + next.name);
				if (current.id) {
					$('#'+current.id+' > h3').css('font-weight', 'normal');
				}
			} else {
				debug('Trigger ' + next.name);
			}
			this.runtime.current = next.name;
			if (next.id) {
				$('#'+next.id+' > h3').css('font-weight', 'bold');
			}
		}
//		debug('End Queue');
		for (i in Workers) {
			Workers[i]._flush();
		}
		this._pop();
	}
};

Queue.enabled = function(worker) {
	try {
		return !(worker.name in this.option.enabled) || this.option.enabled[worker.name];
	} catch(e) {
		return true;
	}
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources:true,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Resources **********
* Store and report Resources

Workers can add a type of Resources that they supply - Player would supply Energy and Stamina when parsing etc
Workers request buckets of Resourcess during init() - each bucket gets a display in the normal Resources config panel.

Items can be added as a type - *however* - they should be added with an amount and not as a spendable type by only calling Resources.add(type,amount)
Convention for unspendable Resourcess is to prefix the name with an underscore, ie. "_someitemimage.jpg" (needs to be unique)

Data can be stored for types by using Resourec.set([type, key], value); etc - this makes it "safer" for workers to discuss needs ;-)
Data can be stored at multiple levels deep - simply add extra keys - [type, key1, key2]

Resources stores the buckets as well as an overflow bucket - the overflow is used during level up

Buckets may be either -
"Shared" buckets are like now - first-come, first-served from a single source
- or -
"Exclusive" buckets are filled by a drip system, forcing workers to share Resourcess

The Shared bucket has a priority of 0

When there is a combination of Shared and Exclusive, the relative priority of the buckets are used - total of all priorities / number of buckets.
Priority is displayed as Disabled, -4, -3, -2, -1, 0, +1, +2, +3, +4, +5

When a worker is disabled (Queue.option.enabled[worker] === false) then it's bucket is completely ignored and Resourcess are shared to other buckets.

Buckets are filled in priority order, in cases of same priority, alphabetical order is used
*/

var Resources = new Worker('Resources');
Resources.settings = {
	system:true,
	unsortable:true
};

Resources.data = {// type:{data} - managed by any access...
};

Resources.option = {
	types:{},
	reserve:{},
	buckets:{}
};

Resources.runtime = {
	types:{},// {'Energy':true}
	buckets:{}
};

Resources.display = 'Discovering Resources...';

Resources.display2 = function() {
	var type, group, worker, require, display = [];
	if (!length(this.runtime.types)) {
		return 'No Resources to be Used...';
	}
	display.push({label:'Not doing anything yet...'});
	for (type in this.option.types) {
		group = [];
		require = {};
		require['types.'+type] = 2;
		for (worker in this.runtime.buckets) {
			if (type in this.runtime.buckets[worker]) {
				group.push({
					id:'buckets.'+worker+'.'+type,
					label:'...<b>'+worker+'</b> priority',
					select:{10:'+5',9:'+4',8:'+3',7:'+2',6:'+1',5:'0',4:'-1',3:'-2',2:'-3',1:'-4',0:'Disabled'}
				});
			}
		}
		if (group.length) {
			display.push({
				title:type
			},{
				advanced:true,
				id:'reserve.'+type,
				label:'Reserve',
				text:true
			},{
				id:'types.'+type,
				label:'Resources Use',
				select:{0:'None',1:'Shared',2:'Exclusive'}
			},{
				group:group,
				require:require
			});
		}
	}
	return display;
};

Resources.init = function() {
//	Config.addOption({label:'test',checkbox:true});
};

Resources.update = function(type, worker) {
	if (!type && !worker) {
		Config.makePanel(this, this.display2);
	}
	var worker, type, total = 0;
//	debug('Resources.update()');
	for (type in this.option.types) {
		for (worker in this.runtime.buckets) {
			if (type in this.runtime.buckets[worker]) {
				if (this.option.types[type] === 2) {// Exclusive
					total += this.runtime.buckets[worker][type];
				} else {
					this.runtime.buckets[worker][type] = 0;
				}
			}
		}
		if (this.option.types[type] === 2 && Math.ceil(total) < Math.floor(this.runtime.types[type])) {// We've got an excess for Exclusive, so share
			total = this.runtime.types[type] - total;
			this.runtime.types[type] -= total;
			this.add(type, total);
		}
	}
//	debug(this.runtime.buckets.toSource());
};

/***** Resources.add() *****
type = name of Resources
amount = amount to add
absolute = is an absolute amount, not relative
1a. If amount isn't set then add a type of Resources that can be spent
1b. Update the display with the new type
1c. Don't do anything else ;-)
2. Changing the amount:
2a. If absolute then get the relative amount and work from there
3. Save the new amount
NOTE: we can add() items etc here, by never calling with just the item name - so it won't ever be "spent"
*/
Resources.add = function(type, amount, absolute) {
//	debug('Resources.add('+type+', '+amount+', '+(absolute ? true : false)+')');
	this._push();
	var i, total = 0, worker, old_amount = this.get(['runtime','types',type], 0);
	if (isUndefined(amount)) {// Setting up that we use this type
		this.set(['runtime','types',type], old_amount);
		this.set(['option','types',type], this.get(['option','types',type], 1));
		this.set(['option','reserve',type], this.get(['option','reserve',type], 0));
	} else {// Telling of any changes to the amount
		if (absolute) {
			amount -= old_amount;
		}
		// Store the new value
		this.set(['runtime','types',type], old_amount + amount);
		// Now fill any pots...
		amount -= Math.max(0, old_amount - parseInt(this.option.reserve[type]));
		if (amount > 0 && this.option.types[type] === 2) {
			for (worker in this.option.buckets) {
				if (type in this.option.buckets[worker]) {
					total += this.option.buckets[worker][type]
				}
			}
			amount /= total;
			for (worker in this.option.buckets) {
				if (type in this.option.buckets[worker]) {
					this.runtime.buckets[worker][type] += amount * this.option.buckets[worker][type];
				}
			}
		}		
	}
	this._pop();
};

/***** Resources.use() *****
Register to use a type of Resources that can be spent
Actually use a type of Resources (must register with no amount first)
type = name of Resources
amount = amount to use
use = are we using it, or just checking if we can?
*/
Resources.use = function(type, amount, use) {
	if (Worker.current) {
		var worker = Worker.current;
		if (isUndefined(amount)) {
			this.set(['runtime','buckets',worker,type], this.get(['runtime','buckets',worker,type], 0));
			this.set(['option','buckets',worker,type], this.get(['option','buckets',worker,type], 5));
		} else if (this.option.types[type] === 1 && this.runtime.types[type] >= amount) {// Shared
			if (use) {
				this.runtime.types[type] -= amount;
			}
			return true;
		} else if (this.option.types[type] === 2 && this.runtime.buckets[worker][type] >= amount) {// Exlusive
			if (use) {
				this.runtime.buckets[worker][type] -= amount;
			}
			return true;
		}
	}
	return false;
};

/***** Resources.has() *****
Check if we've got a certain number of a Resources in total - not on a per-worker basis
Use this to check on "non-spending" resources
*/
Resources.has = function(type, amount) {
	return isUndefined(amount) ? this.get(['runtime','types',type], 0) : this.get(['runtime','types',type], 0) >= amount;
};

Resources.get = function(what,def) {
//	log('Resources.get('+what+', '+(def?def:'null')+')');
	return this._get(what,def);
};

Resources.set = function(what,value) {
//	log('Resources.set('+what+', '+(value?value:'null')+')');
	return this._set(what,value);
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources, Settings:true,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Settings **********
* Save and Load settings by name - never does anything to CA beyond Page.reload()
*/
var Settings = new Worker('Settings');
Settings._rootpath = false; // Override save path so we don't get limited to per-user

Settings.settings = {
	system:true,
	unsortable:true,
	advanced:true
};

Settings.option = {
	action:'None',
	which:'- default -',
	name:'- default -',
	confirm:false
};

Settings.display = [
	{
		title:'IMPORTANT!',
		label:'This will backup and restore your current options.<br>There is no confirmation dialog!'
	},{
		id:'action',
		label:'Action (<b>Immediate!!</b>)',
		select:['None', 'Load', 'Save', 'Delete']
	},{
		id:'which',
		label:'Which',
		select:'settings'
	},{
		id:'name',
		label:'New Name',
		text:true
	}
];

Settings.oldwhich = null;

Settings.init = function() {
	if (!this.data['- default -']) {
		this.set('- default -');
	}
	Settings.oldwhich = this.option.which;
};

Settings.update = function(type) {
	if (type === 'option') {
		var i, list = [];
		if (this.oldwhich !== this.option.which) {
			$('input:golem(settings,name)').val(this.option.which);
			this.option.name = this.option.which;
			this.oldwhich = this.option.which;
		}
		switch (this.option.action) {
			case 'None':
				break;
			case 'Load':
				debug('Loading "' + this.option.which + '"');
				this.get(this.option.which);
				break;
			case 'Save':
				debug('Saving "' + this.option.name + '"');
				this.set(this.option.name);
				this.option.which = this.option.name;
				break;
			case 'Delete':
				if (this.option.which !== '- default -') {
					debug('Deleting "' + this.option.name + '"');
					delete this.data[this.option.which];
				}
				this.option.which = '- default -';
				this.option.name = '- default -';
				break;
			default:
				break;
		}
		$('select:golem(settings,action)').val('None');
		this.option.action = 'None';
		for (i in this.data) {
			list.push(i);
		}
		Config.set('settings', list.sort());
	}
};

Settings.set = function(what, value) {
	var i, x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []);
	if (x.length && (x[0] === 'option' || x[0] === 'runtime')) {
		return this._set(what, value);
	}
	this._unflush();
	this.data[what] = {};
	for (i in Workers) {
		if (Workers[i] !== this && Workers[i].option) {
			this.data[what][i] = $.extend(true, {}, Workers[i].option);
		}
	}
};

Settings.get = function(what) {
	var i, x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []);
	if (x.length && (x[0] === 'option' || x[0] === 'runtime')) {
		return this._get(what);
	}
	this._unflush();
	if (this.data[what]) {
		for (i in Workers) {
			if (Workers[i] !== this && Workers[i].option && this.data[what][i]) {
				Workers[i].option = $.extend(true, {}, this.data[what][i]);
				Workers[i]._save('option');
			}
		}
		Page.reload();
	}
	return;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Title **********
* Changes the window title to user defined data.
* String may contain {stamina} or {Player:stamina} using the worker name (default Player)
*/
var Title = new Worker('Title');
Title.data = null;

Title.settings = {
	system:true,
	unsortable:true,
	advanced:true
};

Title.option = {
	enabled:false,
	title:"CA: {Queue:runtime.current} | {energy}e | {stamina}s | {exp_needed}xp by {LevelUp:time}"
};

Title.display = [
	{
		id:'enabled',
		label:'Change Window Title',
		checkbox:true
	},{
		id:'title',
		text:true,
		size:24
	},{
		title:'Useful Values',
		info:'{myname}<br>{energy} / {maxenergy}<br>{health} / {maxhealth}<br>{stamina} / {maxstamina}<br>{level}<br>{pause} - "(Paused) " when paused<br>{LevelUp:time} - Next level time<br>{Queue:runtime.current} - Activity'
	}
];

Title.old = null; // Old title, in case we ever have to change back

Title.init = function() {
	this._watch(Player);
};

/***** Title.update() *****
* 1. Split option.title into sections containing at most one bit of text and one {value}
* 2. Output the plain text first
* 3. Split the {value} in case it's really {worker:value}
* 4. Output worker.get(value)
* 5. Watch worker for changes
*/
Title.update = function(type) {
	if (this.option.enabled && this.option.title) {
		var i, tmp, what, worker, value, output = '', parts = this.option.title.match(/([^}]+\}?)/g);// split into "text {option}"
		if (parts) {
			for (i=0; i<parts.length; i++) {
				tmp = parts[i].regex(/([^{]*)\{?([^}]*)\}?/);// now split to "text" "option"
				output += tmp[0];
				if (tmp[1]) {
					worker = Player;
					what = tmp[1].split(':');// if option is "worker:value" then deal with it here
					if (what[1]) {
						worker = WorkerByName(what.shift());
					}
					if (worker) {
						value = worker.get(what[0]);
						output += typeof value === 'number' ? addCommas(value) : typeof value === 'string' ? value : '';
						this._watch(worker); // Doesn't matter how often we add, it's only there once...
					} else {
						debug('Bad worker specified = "' + tmp[1] + '"');
					}
				}
			}
		}
		if (!this.old) {
			this.old = document.title;
		}
		document.title = output;
	} else if (this.old) {
		document.title = this.old;
		this.old = null;
	}
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease:true, version, revision, Workers, PREFIX, Images, window, isGreasemonkey, GM_xmlhttpRequest,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
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
		Update.update();
	});
	$('#golem_buttons').append($btn);
	if (isRelease) {
		$btn = $('<img class="golem-button golem-advanced"' + (Config.get('option.advanced') ? '' : ' style="display:none;"') + ' name="Check for Beta Versions" src="' + Images.beta + '">').click(function(){
			$(this).addClass('red');
			isRelease = false;// Isn't persistant, so nothing visible to the user except the beta release
			Update.runtime.force = true;
			Update.update();
		});
		$('#golem_buttons').append($btn);
	}
	this._remind(Math.max(0, (21600000 - (Date.now() - this.runtime.lastcheck)) / 1000));// 6 hours max
};

/***** Update.update() *****
1a. Check that we've not already found an update
1b. Check that it's been more than 6 hours since the last update
2a. Use AJAX to get the google trunk source webpage (list of files and revisions)
2b. Parse out the revision string for both release and beta
3. Display a notification if there's a new version
4. Set a reminder if there isn't
*/
Update.update = function(type,worker) {
	if (!this.found && !this.looking && (this.runtime.force || Date.now() - this.runtime.lastcheck > 21600000)) {// 6+ hours since last check (60x60x6x1000ms)
		this.looking = true;
		this.runtime.lastcheck = Date.now();
		debug('Checking for updates');
		GM_xmlhttpRequest({ // Cross-site ajax, only via GreaseMonkey currently...
			method: "GET",
			url: 'http://code.google.com/p/game-golem/source/browse/trunk',
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
						Update._remind(21600);// 6 hours
						log('No new releases');
					}
					Update.runtime.force = Update.looking = false;
					$('#golem_update').removeClass('red');
				}
			}
		});
	}
};
/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Window **********
* Deals with multiple Windows being open at the same time...
*
* http://code.google.com/p/game-golem/issues/detail?id=86
*
* Use window.name to store global information - so it's reloaded even if the page changes...
*/
var Window = new Worker('Window');
Window.runtime = Window.option = null;
Window._rootpath = false; // Override save path so we don't get limited to per-user

Window.settings = {
	system:true
};

Window.data = {
	active:false,
	list:{}
};

Window.global = {
	'_magic':'golem-magic-key',
	'_id':'#' + Date.now()
};

Window.active = false; // Are we the active tab (able to do anything)?
Window.timeout = 15000; // How long to give a tab to update itself before deleting it (15 seconds)
Window.warning = null;// If clicking the Disabled button when not able to go Enabled

/***** Window.init() *****
1. First try to load window.name information
1a. Parse JSON data and check #1 it's an object, #2 it's got the right magic key (compare to our global magic)
1b. Replace our current global data (including id) with the new one if it's real
2. Save our global data to window.name (maybe just writing back what we just loaded)
3. Add ourselves to this.data.list with the current time
4. If no active worker (in the last 2 seconds) then make ourselves active
4a. Set this.active, this.data.active, and immediately call this._save()
4b/5. Add the "Enabled/Disabled" button, hidden if necessary (hiding other elements if we're disabled)
6. Add a click handler for the Enable/Disable button
6a. Button only works when either active, or no active at all.
6b. If active, make inactive, update this.active, this.data.active and hide other elements
6c. If inactive , make active, update this.active, this.data.active and show other elements (if necessary)
7. Add a repeating reminder for every 1 second
*/
Window.init = function() {
	var now = Date.now(), data;
	try {
		data = JSON.parse((isGreasemonkey ? window.wrappedJSObject : window).name);
		if (typeof data === 'object' && typeof data['_magic'] !== 'undefined' && data['_magic'] === this.global['_magic']) {
			this.global = data;
		}
	} catch(e){}
//	debug('Adding tab "' + this.global['_id'] + '"');
	(isGreasemonkey ? window.wrappedJSObject : window).name = JSON.stringify(this.global);
	this.data['list'] = this.data['list'] || {};
	this.data['list'][this.global['_id']] = now;
	if (!this.data['active'] || typeof this.data['list'][this.data['active']] === 'undefined' || this.data['list'][this.data['active']] < now - this.timeout || this.data['active'] === this.global['_id']) {
		this.active = true;
		this.data['active'] = this.global['_id'];
		this._save('data');// Force it to save immediately - reduce the length of time it's waiting
		$('.golem-title').after('<div id="golem_window" class="golem-info golem-button green" style="display:none;">Enabled</div>');
	} else {
		$('.golem-title').after('<div id="golem_window" class="golem-info golem-button red"><b>Disabled</b></div>');
		$('#golem_window').nextAll().hide();
	}
	$('#golem_window').click(function(event){
		Window._unflush();
		if (Window.active) {
			$(this).html('<b>Disabled</b>').toggleClass('red green').nextAll().hide();
			Window.data['active'] = null;
			Window.active = false;
		} else if (!Window.data['active'] || typeof Window.data['list'][Window.data['active']] === 'undefined' || Window.data['list'][Window.data['active']] < Date.now() - Window.timeout) {
			$(this).html('Enabled').toggleClass('red green');
			$('#golem_buttons').show();
			if (Config.get('option.display') === 'block') {
				$('#golem_config').parent().show();
			}
			Queue.clearCurrent();// Make sure we deal with changed circumstances
			Window.data['active'] = Window.global['_id'];
			Window.active = true;
		} else {// Not able to go active
			$(this).html('<b>Disabled</b><br><span>Another instance running!</span>');
			if (!Window.warning) {
				(function(){
					if ($('#golem_window span').length) {
						if ($('#golem_window span').css('color').indexOf('255') === -1) {
							$('#golem_window span').animate({'color':'red'},200,arguments.callee);
						} else {
							$('#golem_window span').animate({'color':'black'},200,arguments.callee);
						}
					}
				})();
			}
			window.clearTimeout(Window.warning);
			Window.warning = window.setTimeout(function(){if(!Window.active){$('#golem_window').html('<b>Disabled</b>');}Window.warning=null;}, 3000);
		}
		Window._flush();
	});
	this._revive(1); // Call us *every* 1 second - not ideal with loads of Window, but good enough for half a dozen or more
};

/***** Window.update() *****
1. We don't care about any data, only about the regular reminder we've set, so return if not the reminder
2. Update the data[id] to now() so we're not removed
3. If no other open instances then make ourselves active (if not already) and remove the "Enabled/Disabled" button
4. If there are other open instances then show the "Enabled/Disabled" button
*/
Window.update = function(type,worker) {
	if (type !== 'reminder') {
		return;
	}
	var i, now = Date.now();
	this.data = this.data || {};
	this.data['list'] = this.data['list'] || {};
	this.data['list'][this.global['_id']] = now;
	for(i in this.data['list']) {
		if (this.data['list'][i] < (now - this.timeout)) {
			delete this.data['list'][i];
		}
	}
	i = length(this.data['list']);
	if (i === 1) {
		if (!this.active) {
			$('#golem_window').css('color','black').html('Enabled').toggleClass('red green');
			$('#golem_buttons').show();
			if (Config.get('option.display') === 'block') {
				$('#golem_config').parent().show();
			}
			Queue.set('runtime.current', null);// Make sure we deal with changed circumstances
			this.data['active'] = this.global['_id'];
			this.active = true;
		}
		$('#golem_window').hide();
	} else if (i > 1) {
		$('#golem_window').show();
	}
	this._flush();// We really don't want to store data any longer than we really have to!
};

/***** Window.get() *****
1. Load data as Worker._get() but only for global window data
*/
Window.get = function(what, def) { // 'path.to.data'
	var x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []), data = this.global;
	try {
		return (function(a,b,d){
			if (b.length) {
				var c = b.shift();
				return arguments.callee(a[c],b,d);
			} else {
				return typeof a !== 'undefined' ? a : d;
			}
		})(data,x,def);
	} catch(e) {
		if (typeof def === 'undefined') {
			debug(e.name + ' in ' + this.name + '.get('+what.toString()+'): ' + e.message);
		}
	}
	return typeof def !== 'undefined' ? def : null;// Don't want to return "undefined" at this time...
};

/***** Window.set() *****
1. Save data as Worker._get() but only for global window data
*/
Window.set = function(what, value) {
	var x = typeof what === 'string' ? what.split('.') : (typeof what === 'object' ? what : []), data = this.global;
	if (!x.length) {
		return;
	}
	try {
		(function(a,b){
			var c = b.shift();
			if (b.length) {
				if (typeof a[c] !== 'object') {
					a[c] = {};
				}
				arguments.callee(a[c], b);
				if (!length(a[c])) {// Can clear out empty trees completely...
					delete a[c];
				}
			} else {
				if (typeof value !== 'undefined') {
					a[c] = value;
				} else {
					delete a[c];
				}
			}
		})(data,x);
		(isGreasemonkey ? window.wrappedJSObject : window).name = JSON.stringify(this.global);// Save immediately
	} catch(e) {
		debug(e.name + ' in ' + this.name + '.set('+what+', '+value+'): ' + e.message);
	}
	return;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Alchemy **********
* Get all ingredients and recipes
*/
var Alchemy = new Worker('Alchemy');

Alchemy.defaults['castle_age'] = {
	pages:'keep_alchemy'
};

Alchemy.data = {
	ingredients:{},
	summons:{},
	recipe:{}
};

Alchemy.option = {
	perform:false,
	hearts:false,
	summon:false
};

Alchemy.runtime = {
	best:null
};

Alchemy.display = [
	{
		id:'hearts',
		label:'Use Battle Hearts',
		checkbox:true
	},{
		id:'summon',
		label:'Use Summon Ingredients',
		checkbox:true
	}
];

Alchemy.parse = function(change) {
	this.data.ingredients = {};
	this.data.recipe = {};
	this.data.summons = {};
	var $elements = $('div.alchemyQuestBack,div.alchemyRecipeBack,div.alchemyRecipeBackMonster');
	if (!$elements.length) {
		debug('Can\'t find any alchemy ingredients...');
//		Page.to('keep_alchemy', false); // Force reload
		return false;
	}
	$elements.each(function(i,el){
		var recipe = {}, title = $('div.recipeTitle', el).text().trim().replace('RECIPES: ','');
		if (title.indexOf(' (')>0) {
			title = title.substr(0, title.indexOf(' ('));
		}
		if ($(el).hasClass('alchemyQuestBack')) {
			recipe.type = 'Quest';
		} else if ($(el).hasClass('alchemyRecipeBack')) {
			recipe.type = 'Recipe';
		} else if ($(el).hasClass('alchemyRecipeBackMonster')) {
			recipe.type = 'Summons';
		}
		recipe.ingredients = {};
		$('div.recipeImgContainer', el).parent().each(function(i,el){
			var name = $('img', el).attr('src').filepart();
			recipe.ingredients[name] = ($(el).text().regex(/x([0-9]+)/) || 1);
			Alchemy.data.ingredients[name] = 0;// Make sure we know an ingredient exists
			if (recipe.type === 'Summons') {
				Alchemy.data.summons[name] = true;// Make sure we know an ingredient exists
			}
		});
		Alchemy.data.recipe[title] = recipe;
	});
	$('div.ingredientUnit').each(function(i,el){
		var name = $('img', el).attr('src').filepart();
		Alchemy.data.ingredients[name] = $(el).text().regex(/x([0-9]+)/);
	});
};

Alchemy.update = function() {
	var best = null, recipe = this.data.recipe, r, i;
	for (r in recipe) {
		if (recipe[r].type === 'Recipe') {
			best = r;
			for (i in recipe[r].ingredients) {
				if ((!this.option.hearts && i === 'raid_hearts.gif') || (!this.option.summon && this.data.summons[i]) || recipe[r].ingredients[i] > this.data.ingredients[i]) {
					best = null;
					break;
				}
			}
			if (best) {break;}
		}
	}
	this.runtime.best = best;
};

Alchemy.work = function(state) {
	if (!this.runtime.best) {
		return QUEUE_FINISH;
	}
	if (!state || !Page.to('keep_alchemy')) {
		return QUEUE_CONTINUE;
	}
	debug('Perform - ' + this.runtime.best);
	if (!Page.click($('input[type="image"]', $('div.recipeTitle:contains("' + this.runtime.best + '")').next()))) {
		Page.reload(); // Can't find the recipe we just parsed when coming here...
	}
	return QUEUE_RELEASE;
};

/********** Worker.Arena() **********
* Build your arena army
* Auto-attack Arena targets
*/
var Arena = new Worker('Arena', 'battle_arena');
Arena.data = {
	user:{},
	points:0,
	rank:0
};

Arena.option = {
	enabled:false,
	general:true,
	general_choice:'any',
	losses:2,
	cache:50,
	minRR: 0,
	maxRR: 5,
	bp:'Don\'t Care',
	level:'Any',
	tokens:'All'
};

Arena.runtime = {
	recheck:false,
	attacking:null,
	tokens:0,
	listlength:'tbd'
};

Arena.rank = {
	Brawler:1,
	Swordsman:2,
	Warrior:3,
	Gladiator:4,
	Hero:5,
	Vanguard:6,
	'Alpha Vanguard':7
};

Arena.knar = [
	'None',
	'Brawler',
	'Swordsman',
	'Warrior',
	'Gladiator',
	'Hero',
	'Vanguard',
	'Alpha Vanguard'
];

Arena.display = [
	{
		label:'NOTE: Make sure this is disabled if you are not fighting!<br>You need Stamina to Battle (though it doesn\'t use any)'
	},{
		id:'enabled',
		label:'Enabled',
		checkbox:true
	},{
		id:'general',
 		label:'Use Best General',
		checkbox:true
	},{
		advanced:true,
		id:'general_choice',
		label:'Use General',
		require:{'general':false},
		select:'generals'
	},{
		id:'minRR',
		label:'Minimum Relative Rank<br>(Clears Cache)',
		select:[-5,-4,-3,-2,-1,0,1,2,3,4,5]
	},{
		id:'maxRR',
		label:'Maximum Relative Rank<br>(Clears Cache)',
		select:[-5,-4,-3,-2,-1,0,1,2,3,4,5]
/*	},{
		id:'bp',
		label:'Higher Relative Rank<br>(Clears Cache)',
		select:['Always', 'Never', 'Don\'t Care']
*/	},{
		advanced:true,
		id:'tokens',
		label:'Use Tokens',
		select:['All', 'Minimum', 'None'],
		help:'How should arena tokens be used - all of them, none of them, or only to prevent wasting them...'
	},{
		id:'rank',
		label:'Stop at Rank',
		select:Arena.knar,
		help:'Once you reach this rank it will gain a further 500 points, then check your rank every hour'
	},{
		advanced:true,
		id:'losses',
		label:'Attack Until',
		select:['Ignore',1,2,3,4,5,6,7,8,9,10],
		after:'Losses'
	},{
		advanced:true,
		id:'cache',
		label:'Limit Cache Length',
		select:[50,100,150,200,250]
	},{
		id:'level',
		label:'Target Level Ratio',
		select:['Any', 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
		help:'Smaller number for lower target level. Reduce this number if you\'re losing a lot'
	}
];

Arena.init = function() {
	this._revive(360, 'tokens');// Gain more points every 10 minutes
};

Arena.parse = function(change) {
	var data = this.data.user, newrank;
	var data = this.data.user, newrank, Playerlevel = Player.get('level');
	if ($('#app'+APPID+'_arena_body div div:contains("Arena is over, wait for next season!")').length) {
		// Arena is over for now, so disable and return!
		this.option.enabled = false;
//		$('#' + PREFIX + this.name + '_enabled').attr('checked', false);
//		$('#' + PREFIX + Elite.name + '_arena').attr('checked', false);
//		Elite.set('option.arena', false);
		return false;
	}
	if (this.runtime.attacking) {
		uid = this.runtime.attacking;
		this.runtime.attacking = null;
		if ($('div.results').text().match(/You have already attacked this player 5 times, move onto the next victim/i)) {
			data[uid].stop = Date.now();
		} else if ($('div.results').text().match(/Your opponent is dead or too weak/i)) {
			data[uid].hide = (data[uid].hide || 0) + 1;
			data[uid].dead = Date.now();
		} else if (!$('div.results').text().match(new RegExp(data[uid].name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")+"( fought with:|'s Army of [0-9]+ fought with|'s Defense)",'i'))) {
			this.runtime.attacking = uid; // Don't remove target as we've hit someone else...
		} else if ($('img[src*="battle_victory"]').length) {
			data[uid].win = (data[uid].win || 0) + 1;
		} else if ($('img[src*="battle_defeat"]').length) {
			data[uid].loss = (data[uid].loss || 0) + 1;
		} else {
			this.runtime.attacking = uid; // Don't remove target as we've not hit them...
		}
	}
	this.runtime.tokens = $('#app'+APPID+'_arena_token_current_value').text().regex(/([0-9]+)/i);
	this._revive(360, 'tokens');// Gain more points every 10 minutes, restart from now
	newrank = $('#app'+APPID+'_arena_body img[src*="arena2_rank"]').attr('src').regex(/arena2_rank([0-9]+).gif/i);
	this.data.points = $('#app'+APPID+'_arena_body img[src*="arena2_rank"]').parent().next().next().text().replace(/,/g,'').regex(/Points: ([0-9]+)/i);
	if (this.data.rank !== newrank) {
		this.data.rank = newrank;
		this.data.rankat = this.data.points;
	}
	$('#app'+APPID+'_arena_body table tr:odd').each(function(i,el){
		var uid = $('img[uid]', el).attr('uid'), info = $('td.bluelink', el).text().trim().regex(/Level ([0-9]+) (.*)/i), rank, level;
		if (!uid || !info) {
			return;
		}
		rank = Arena.rank[info[1]];
		level = info[0];
//		if ((Arena.option.bp === 'Always' && Arena.data.rank - rank > 1) || (!Arena.option.bp === 'Never' && Arena.data.rank - rank < 0)) {
		if ((rank - Arena.data.rank < Arena.option.minRR) || (rank - Arena.data.rank > Arena.option.maxRR)) {
			return;
		}
		data[uid] = data[uid] || {};
		data[uid].name = $('a', el).text().trim();
		data[uid].level = level;
		data[uid].rank = rank;
	});
	return false;
};

Arena.update = function(type, worker) {
	if (type === 'reminder' && !worker) {
		this.runtime.tokens = Math.min(150, this.runtime.tokens + 1);
		return;
	}
	var i, list = [], data = this.data.user, level = Player.get('level'), status = [];
	// First make check our target list doesn't need reducing
	for (i in data) { // Forget low or high rank - no points or too many points
//		if ((this.option.bp === 'Always' && this.data.rank - data[i].rank > 0) || (!this.option.bp === 'Never' && this.data.rank - data[i].rank < 0)) {
		if((data[i].rank - this.data.rank < Arena.option.minRR) || (data[i].rank - this.data.rank > Arena.option.maxRR)){
			delete data[i];
		}
	}
	if (length(data) > this.option.cache) { // Need to prune our attack cache
//		debug(this.name,'Pruning target cache');
		for (i in data) {
			list.push(i);
		}
		list.sort(function(a,b) {
			var weight = 0;
				 if (((data[a].win || 0) - (data[a].loss || 0)) < ((data[b].win || 0) - (data[b].loss || 0))) { weight += 10; }
			else if (((data[a].win || 0) - (data[a].loss || 0)) > ((data[b].win || 0) - (data[b].loss || 0))) { weight -= 10; }
			//if (Arena.option.bp === 'Always') { weight += (data[b].rank - data[a].rank); }
			//if (Arena.option.bp === 'Never') { weight += (data[a].rank - data[b].rank); }
			weight += (data[b].rank - data[a].rank);
			weight += Math.range(-1, (data[b].hide || 0) - (data[a].hide || 0), 1);
			weight += Math.range(-10, ((data[a].level - data[b].level) / 10), 10);
			return weight;
		});
		while (list.length > this.option.cache) {
			delete data[list.pop()];
		}
	}
	// Choose our next target
	status.push('Rank ' + this.data.rank + ' ' + this.knar[this.data.rank] + ' with ' + addCommas(this.data.points || 0) + ' Points, Targets: ' + length(data) + ' / ' + this.option.cache + ' (' + makeImage('arena') + this.runtime.tokens + ')');
	if (!this.option.enabled) {
		this.runtime.attacking = null;
	} else if (this.option.rank !== 'None' && this.data.rank >= this.rank[this.option.rank] && this.data.points - this.data.rankat >= 500) {
		this.runtime.attacking = null;
		status.push('Stopped at ' + this.option.rank);
		this.runtime.recheck = (Page.get('battle_arena') + 3600000 < Date.now());
	} else {
		if (!this.runtime.attacking || !data[this.runtime.attacking]
		|| (this.option.level !== 'Any' && (data[this.runtime.attacking].level / level) > this.option.level)) {
			list = [];
			for (i in data) {
				if ((data[i].dead && data[i].dead + 1800000 >= Date.now()) // If they're dead ignore them for 3m * 10hp = 30 mins
				|| (data[i].stop && data[i].stop + 86400000 >= Date.now()) // If no more attack are available ignore them for one day
				|| (typeof this.option.losses === 'number' && (data[i].loss || 0) >= this.option.losses) // Don't attack someone who wins more than this.option.losses
				|| (this.option.level !== 'Any' && (data[i].level / level) > this.option.level)) {
					continue;
				}
				list.push(i);
			}
			if (list.length) {
				this.runtime.attacking = list[Math.floor(Math.random() * list.length)];
			} else {
				this.runtime.attacking = null;
			}
			this.runtime.listlength = list.length;
		}
	}
	if (this.option.enabled) {
		if (this.runtime.attacking) {
			i = this.runtime.attacking;
			status.push( 'Next Target: ' + data[i].name + ' (Level ' + data[i].level + ' ' + this.knar[data[i].rank] + ')');
		} else {
			this.runtime.attacking = null;
			status.push('No valid targets found!');
		}
		Dashboard.status(this, status.join('<br>'));
	} else {
		Dashboard.status(this);
	}
}

Arena.work = function(state) {
	// Needs 1 stamina, even though it doesn't use any...
	if (!this.option.enabled || this.option.tokens === 'None' || (!this.runtime.recheck && (!this.runtime.attacking || this.runtime.tokens < 10 || (this.option.tokens === 'Minimum' && this.runtime.tokens < 150) || Player.get('health',0) < 10 || Player.get('stamina',0) < 1))) {
		return false;
	}
	if (state && this.runtime.recheck && !Page.to('battle_arena')) {
		return true;
	}
	if (!state || this.runtime.recheck || !Generals.to(this.option.general ? 'war' : this.option.general_choice) || !Page.to('battle_arena')) {
		return true;
	}
	var uid = this.runtime.attacking, $form = $('form input[alt="Invade"]').first().parents('form');;
	debug(this.name,'Wanting to attack '+this.data.user[uid].name+' ('+uid+')');
	if (!$form.length) {
		log(this.name,'Arena: Unable to find attack buttons, forcing reload');
		Page.to('index');
	} else {
		$('input[name="target_id"]', $form).attr('value', uid);
		Page.click($('input[type="image"]', $form));
	}
	return true;
};

Arena.order = [];
Arena.dashboard = function(sort, rev) {
	var i, o, list = [], output = [], sorttype = ['rank', 'name', 'level', 'win', 'loss', 'hide'], data = this.data.user, army = Player.get('army'), level = Player.get('level');
	if (typeof sort === 'undefined') {
		this.order = [];
		for (i in data) {
			this.order.push(i);
		}
		sort = 1; // Default = sort by name
	}
	if (typeof sorttype[sort] === 'string') {
		this.order.sort(function(a,b) {
			var aa = (data[a][sorttype[sort]] || 0), bb = (data[b][sorttype[sort]] || 0);
			if (typeof aa === 'string' || typeof bb === 'string') {
				return (rev ? bb > aa : bb < aa);
			}
			return (rev ? aa - bb : bb - aa);
		});
	}

	list.push('<div style="text-align:center;"><strong>Rank:</strong> ' + this.knar[this.data.rank] + ' (' + this.data.rank + ') with ' + addCommas(this.data.points || 0) + ' Points, <strong>Targets:</strong> ' + length(data) + ' / ' + this.option.cache + ' (' + this.runtime.listlength + ' valid), ' + makeImage('arena') + this.runtime.tokens + '</div><hr>');
	th(output, 'Rank');
	th(output, 'Name');
	th(output, 'Level');
	th(output, 'Wins');
	th(output, 'Losses');
	th(output, 'Hides');
	list.push('<table cellspacing="0" style="width:100%"><thead><tr>' + output.join('') + '</tr></thead><tbody>');
	for (o=0; o<this.order.length; o++) {
		data = this.data.user[this.order[o]];
		output = [];
		if(this.option.level !== 'Any' && (data.level / level) > this.option.level){
			continue;
		}
		td(output, '<img style="width:22px;height:22px;" src="' + imagepath + 'arena2_rank' + data.rank + '.gif">', 'title="' + this.knar[data.rank] + ' (Rank ' + data.rank + ')"');
		th(output, data.name, 'title="'+this.order[o]+'"');
		td(output, (this.option.level !== 'Any' && (data.level / level) > this.option.level) ? '<i>'+data.level+'</i>' : data.level);
		td(output, data.win || '');
		td(output, data.loss || '');
		td(output, data.hide || '');
		tr(list, output.join(''));
	}
	list.push('</tbody></table>');
	$('#golem-dashboard-Arena').html(list.join(''));
	if (typeof sort !== 'undefined') {
		$('#golem-dashboard-Arena thead th:eq('+sort+')').attr('name',(rev ? 'reverse' : 'sort')).append('&nbsp;' + (rev ? '&uarr;' : '&darr;'));
	}
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page:true, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Bank **********
* Auto-banking
*/
var Bank = new Worker('Bank');
Bank.data = null;

Bank.defaults['castle_age'] = {};

Bank.option = {
	general:true,
	above:10000,
	hand:0,
	keep:10000,
	status:true
};

Bank.display = [
	{
		id:'general',
		label:'Use Best General',
		checkbox:true
	},{
		id:'above',
		label:'Bank Above',
		text:true
	},{
		id:'hand',
		label:'Keep in Cash',
		text:true
	},{
		id:'keep',
		label:'Keep in Bank',
		text:true
	},{
		id:'status',
		label:'Show in Dashboard',
		checkbox:true
	}
];

Bank.init = function() {
	this._watch(Player);
};

Bank.work = function(state) {
	if (Player.get('cash') <= 10 || Player.get('cash') <= this.option.above) {
		return QUEUE_FINISH;
	} else if (!state || this.stash(Player.get('cash') - this.option.hand)) {
		return QUEUE_CONTINUE;
	}
	return QUEUE_RELEASE;
};

Bank.update = function(type, worker) {
	if (this.option.status) {// Don't use this.worth() as it ignores this.option.keep
		Dashboard.status(this, 'Worth: ' + makeImage('gold') + '$' + addCommas(Player.get('cash') + Player.get('bank')) + ' (Upkeep ' + (Player.get('upkeep') / Player.get('maxincome') * 100).round(2) + '%)<br>Income: ' + makeImage('gold') + '$' + addCommas(Player.get('income') + History.get('income.average.24').round()) + ' per hour (currently ' + makeImage('gold') + '$' + addCommas(Player.get('income')) + ' from land)');
	} else {
		Dashboard.status(this);
	}
};

Bank.stash = function(amount) {
	if (!amount || !Player.get('cash') || Math.min(Player.get('cash'),amount) <= 10) {
		return true;
	}
	if ((this.option.general && !Generals.to('bank')) || !Page.to('keep_stats')) {
		return false;
	}
	$('input[name="stash_gold"]').val(Math.min(Player.get('cash'), amount));
	Page.click('input[value="Stash"]');
	return true;
};

Bank.retrieve = function(amount) {
	WorkerByName(Queue.get('runtime.current')).settings.bank = true;
	amount -= Player.get('cash');
	if (amount <= 0 || (Player.get('bank') - this.option.keep) < amount) {
		return true; // Got to deal with being poor exactly the same as having it in hand...
	}
	if (!Page.to('keep_stats')) {
		return false;
	}
	$('input[name="get_gold"]').val(amount.toString());
	Page.click('input[value="Retrieve"]');
	return false;
};

Bank.worth = function(amount) { // Anything withdrawing should check this first!
	var worth = Player.get('cash') + Math.max(0,Player.get('bank') - this.option.keep);
	if (typeof amount === 'number') {
		return (amount <= worth);
	}
	return worth;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle:true, Generals, LevelUp, Monster, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Battle **********
* Battling other players (NOT raid or Arena)
*/
var Battle = new Worker('Battle');

Battle.defaults['castle_age'] = {
	pages:'battle_rank battle_battle'
};

Battle.data = {
	user: {},
	rank: {},
	points: {}
};

Battle.option = {
	general:true,
	general_choice:'any',
	points:'Invade',
	monster:true,
	arena:false,
	losses:5,
	type:'Invade',
	bp:'Always',
	army:1.1,
	level:1.1,
	preferonly:'Sometimes',
	prefer:[],
	between:0,
	risk:false
};

Battle.runtime = {
	attacking:null,
	points:false
};

Battle.symbol = { // Demi-Power symbols
	1:"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%16%00%00%00%16%08%03%00%00%00%F3j%9C%09%00%00%00%18PLTE%17%90%B3%1AIn%99%AD%B0%3F%5Erj%7F%8A4%40J%22*1%FF%FF%FFm%0F%82%CD%00%00%00%08tRNS%FF%FF%FF%FF%FF%FF%FF%00%DE%83%BDY%00%00%00%ABIDATx%DAl%91%0B%0E%04!%08CAh%E7%FE7%DE%02%BA3%FBib%A2O%A8%02vm%91%00xN%B6%A1%10%EB%86O%0C%22r%AD%0Cmn%0C%8A%8Drxa%60-%B3p%AF%8C%05%0C%06%15d%E6-%5D%90%8D%E5%90~%B0x%A20e%117%0E%D9P%18%A1%60w%F3%B0%1D%1E%18%1C%85m'D%B9%08%E7%C6%FE%0F%B7%CF%13%C77%1Eo%F4%93%05%AA%24%3D%D9%3F%E1%DB%25%8E%07%BB%CA%D8%9C%8E%FE6%A6J%B9%1F%FB%DAa%8A%BFNW3%B5%9ANc%D5%FEn%9El%F7%20%F6tt%8C%12%F01%B4%CE%F8%9D%E5%B7%5E%02%0C%00n%97%07%B1AU%81%B7%00%00%00%00IEND%AEB%60%82",
	2:"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%16%00%00%00%16%08%03%00%00%00%F3j%9C%09%00%00%00%18PLTE%E0%0D%0CZ%5B%5Bv%13%0F%2F%1A%16%7Byx%8941DB%3F%FF%FF%FFOmpc%00%00%00%08tRNS%FF%FF%FF%FF%FF%FF%FF%00%DE%83%BDY%00%00%00%B4IDATx%DAT%D1%5B%12%C5%20%08%03P%08%C2%DD%FF%8Eo%12%EB%D8%F2%D1%C7%C1%01%C5%F8%3DQ%05T%9D%BFxP%C6%07%EA%CDF%07p%998%B9%14%C3%C4aj%AE%9CI%A5%B6%875zFL%0F%C8%CD%19vrG%AC%CD%5C%BC%C6nM%D57'%EB%CA%AD%EC%C2%E5b%B5%93%5B%E9%97%99%40D%CC%97sw%DB%FByqwF%83u%FA%F2%C8%A3%93u%A0%FD%8C%B8%BA%96NAn%90%17%C1%C7%E1'%D7%F2%85%01%D4%DC%A7d%16%EDM2%1A%C3%C5%1E%15%7DX%C7%23%19%EB%1El%F5h%B2lV%5B%CF%ED%A0w%89~%AE'%CE%ED%01%F7%CA%5E%FC%8D%BF%00%03%00%AA%CE%08%23%FB4h%C4%00%00%00%00IEND%AEB%60%82",
	3:"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%16%00%00%00%16%08%03%00%00%00%F3j%9C%09%00%00%00%18PLTE%B1%98g%DE%BCyqpq%8CnF%12%11%0EME7y8%0B%FF%FF%FF6%A1%E73%00%00%00%08tRNS%FF%FF%FF%FF%FF%FF%FF%00%DE%83%BDY%00%00%00%B7IDATx%DA%5C%91Y%16C!%0CB%C9%40%BA%FF%1D%17%7Cz%9Em%BE%F4%8A%19%08%3E%3BX%40%F1%DC%B0%A1%99_xcT%EF(%BC8%D8%CC%9A%A9%D4!%0E%0E%8Bf%863%FE%16%0F%06%5BR%22%02%1C%A0%89%07w%E6T%AC%A8A%F6%C2%251_%9CPG%C2%A1r7N%CB%E1%1CtN%E7%06%86%7F%B85%8B%1A%22%2F%AC%3E%D4%B2_.%9C%C6%EA%B3%E2%C6%BB%24%CA%25uY%98%D5H%0D%EE%922%40b%19%09%CFNs%99%C8Y%E2XS%D2%F3*%0F7%B5%B9%B6%AA%16_%0E%9A%D61V%DCu-%E5%A2g%3BnO%C1%B3%1E%9C%EDiax%94%3F%F87%BE%02%0C%00%98%F2%07%E0%CE%8C%E4%B1%00%00%00%00IEND%AEB%60%82",
	4:"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%16%00%00%00%16%08%03%00%00%00%F3j%9C%09%00%00%00%18PLTE%90%CA%3CSTRq%9B5On*%10%13%0Dx%7Ct6B'%FF%FF%FFx%0A%94%CE%00%00%00%08tRNS%FF%FF%FF%FF%FF%FF%FF%00%DE%83%BDY%00%00%00%B2IDATx%DAT%D1A%16%C4%20%08%03P%20%92%B9%FF%8D'%80%B5%96%85%AF~%95*%D8o%07%09%90%CF%CC6%96%F5%CA%CD%E0%DAA%BC%0CM%B3C%CBxX%9A%E9%15Z%18%B7QW%E2%DB%9B%3D%E0%CD%99%11%18V%3AM%02%CD%FA%08.%8A%B5%D95%B1%A0%A7%E9Ci%D0%9Cb3%034D%F8%CB(%EE%F8%F0%F1%FA%C5ae9%BB%FD%B0%A7%CF%F9%1Au%9FfR%DB%A3%A19%179%CFa%B1%8E%EB*%91%BE_%B9*M%A9S%B7%97%AE)%15%B5%3F%BAX%A9%0Aw%C9m%9A%A0%CA%AA%20%5Eu%E5%D5%1DL%23%D4%9Eu7%AD%DBvZv%F17%FE%02%0C%00%D3%0A%07%E1%0961%CF%00%00%00%00IEND%AEB%60%82",
	5:"data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%16%00%00%00%16%08%03%00%00%00%F3j%9C%09%00%00%00%18PLTE%F2%F2%EF!!%20%A5%A5%A3vvv%5BZZ%3D%3D%3B%00%00%00%FF%FF%FF.%C4%F9%B3%00%00%00%08tRNS%FF%FF%FF%FF%FF%FF%FF%00%DE%83%BDY%00%00%00%BEIDATx%DA%5C%91Q%92%C30%08C%11B%DE%FB%DFx%25%C7n3%E5%23%E3%3Cd%01%A6%FEN%00%12p%FF%EA%40%A3%05%A7%F0%C6%C2%0A%CCW_%AC%B5%C4%1D9%5D%EC39%09'%B0y%A5%D8%E2H%5D%D53%DDH%E1%E05%A6%9A2'%9Bkcw%40%E9%C5e%5Ev%B6g%E4%B1)%DA%DF%EEQ%D3%A0%25Vw%EC%B9%D5)%C8%5Cob%9C%1E%E2%E2%D8%16%F1%94%F8%E0-%AF%B9%F8x%CB%F2%FE%C8g%1Eo%A03w%CA%86%13%DB%C4%1D%CA%7C%B7%E8w%E4d%FAL%E9%CE%9B%F3%F0%D0g%F8%F0%AD%CFSyD%DC%875%87%3B%B0%D1%5D%C4%D9N%5C%13%3A%EB%A9%F7.%F5%BB%CB%DF%F8%17%60%00%EF%2F%081%0F%2BNZ%00%00%00%00IEND%AEB%60%82"
};
Battle.demi = {
	1:'Ambrosia',
	2:'Malekus',
	3:'Corvintheus',
	4:'Aurora',
	5:'Azeron'
};

Battle.display = [
	{
		id:'general',
		label:'Use Best General',
		checkbox:true
	},{
		advanced:true,
		id:'general_choice',
		label:'Use General',
		require:{'general':false},
		select:'generals'
	},{
		id:'type',
		label:'Battle Type',
		select:['Invade', 'Duel', 'War'],
		help:'War needs level 100+, and is similar to Duel - though also uses 10 stamina'
	},{
		id:'points',
		label:'Get Demi-Points Type',
		select:['Never', 'Invade', 'Duel'],
		help:'This will make you attack specifically to get Demi-Points every day. War (above) will not earn Demi-Points, but otherwise you will gain them through normal battle - just not necessarily all ten a day'
	},{
		id:'losses',
		label:'Attack Until',
		select:['Ignore',1,2,3,4,5,6,7,8,9,10],
		after:'Losses'
	},{
//		advanced:true,
//		id:'arena',
//		label:'Fight in Arena First',
//		checkbox:true,
//		help:'Only if the Arena is enabled!'
//	},{
		advanced:true,
		id:'monster',
		label:'Fight Monsters First',
		checkbox:true
	},{
		id:'bp',
		label:'Get Battle Points<br>(Clears Cache)',
		select:['Always', 'Never', 'Don\'t Care']
	},{
		advanced:true,
		id:'cache',
		label:'Limit Cache Length',
		select:[100,200,300,400,500]
	},{
		advanced:true,
		id:'between',
		label:'Time Between Attacks<br>(On same target)',
		select:{
			0:'none',
			300000:'5 mins',
			900000:'15 mins',
			1800000:'30 mins',
			3600000:'1 hour',
			7200000:'2 hours',
			21600000:'6 hours',
			43200000:'12 hours',
			86400000:'24 hours'
		},
		help:'Stop yourself from being as noticed, but may result in fewer attacks and slower advancement'
	},{
		advanced:true,
		id:'risk',
		label:'Risk Death',
		checkbox:true,
		help:'The lowest health you can attack with is 10, but you can lose up to 12 health in an attack, so are you going to risk it???'
	},{
		id:'army',
		require:{'type':'Invade'},
		label:'Target Army Ratio<br>(Only needed for Invade)',
		select:['Any', 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
		help:'Smaller number for smaller target army. Reduce this number if you\'re losing in Invade'
	},{
		id:'level',
		require:{'type':[['Invade']]},
		label:'Target Level Ratio<br>(Mainly used for Duel)',
		select:['Any', 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
		help:'Smaller number for lower target level. Reduce this number if you\'re losing a lot'
	},{
		advanced:true,
		hr:true,
		title:'Preferred Targets'
	},{
		advanced:true,
		id:'preferonly',
		label:'Fight Preferred',
		select:['Never', 'Sometimes', 'Only', 'Until Dead']
	},{
		advanced:true,
		id:'prefer',
		multiple:'userid'
	}
];

/***** Battle.init() *****
1. Watch Arena and Monster for changes so we can update our target if needed
*/
Battle.init = function() {
//	this._watch(Arena);
	this._watch(Monster);
	if (typeof this.option.points === 'boolean') {
		this.option.points = this.option.points ? (this.option.type === 'War' ? 'Duel' : this.option.type) : 'Never';
		$(':golem(Battle,points)').val(this.option.points);
	}
	this.option.arena = false;// ARENA!!!!!!
	Resources.use('Stamina');
};

/***** Battle.parse() *****
1. On the Battle Rank page parse out our current Rank and Battle Points
2. On the Battle page
2a. Check if we've just attacked someone and parse out the results
2b. Parse the current Demi-Points
2c. Check every possible target and if they're eligable then add them to the target list
*/
Battle.parse = function(change) {
	var data, uid, tmp, myrank;
	if (Page.page === 'battle_rank') {
		data = {0:{name:'Newbie',points:0}};
		$('tr[height="23"]').each(function(i,el){
			var info = $(el).text().regex(/Rank ([0-9]+) - (.*)\s*([0-9]+)/i);
			data[info[0]] = {name:info[1], points:info[2]};
		});
		this.data.rank = data;
		this.data.bp = $('span:contains("Battle Points.")', 'div:contains("You are a Rank")').text().replace(/,/g, '').regex(/with ([0-9]+) Battle Points/i);
	} else if (Page.page === 'battle_battle') {
		data = this.data.user;
		if (this.runtime.attacking) {
			uid = this.runtime.attacking;
			this.runtime.attacking = null;
			if ($('div.results').text().match(/You cannot battle someone in your army/i)) {
				delete data[uid];
			} else if ($('div.results').text().match(/This trainee is too weak. Challenge someone closer to your level/i)) {
				delete data[uid];
			} else if ($('div.results').text().match(/They are too high level for you to attack right now/i)) {
				delete data[uid];
			} else if ($('div.results').text().match(/Their army is far greater than yours! Build up your army first before attacking this player!/i)) {
				delete data[uid];
			} else if ($('div.results').text().match(/Your opponent is dead or too weak/i)) {
				data[uid].hide = (data[uid].hide || 0) + 1;
				data[uid].dead = Date.now();
			} else if (!$('div.results').text().match(new RegExp(data[uid].name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")+"( fought with:|'s Army of ([0-9]+) fought with|'s Defense)",'i'))) {
				this.runtime.attacking = uid; // Don't remove target as we've hit someone else...
			} else if ($('img[src*="battle_victory"]').length) {
				this.data.bp = $('span.result_body:contains("Battle Points.")').text().replace(/,/g, '').regex(/total of ([0-9]+) Battle Points/i);
				data[uid].win = (data[uid].win || 0) + 1;
				data[uid].last = Date.now();
				History.add('battle+win',1);
			} else if ($('img[src*="battle_defeat"]').length) {
				data[uid].loss = (data[uid].loss || 0) + 1;
				data[uid].last = Date.now();
				History.add('battle+loss',-1);
			} else {
				this.runtime.attacking = uid; // Don't remove target as we've not hit them...
			}
		}
		tmp = $('#app'+APPID+'_app_body table.layout table div div:contains("Once a day you can")').text().replace(/[^0-9\/]/g ,'').regex(/([0-9]+)\/10([0-9]+)\/10([0-9]+)\/10([0-9]+)\/10([0-9]+)\/10/);
		if (tmp) {
			this.data.points = tmp;
		}
		myrank = Player.get('rank');
		$('#app'+APPID+'_app_body table.layout table table tr:even').each(function(i,el){
			var uid = $('img[uid!==""]', el).attr('uid'), info = $('td.bluelink', el).text().replace(/[ \t\n]+/g, ' '), rank = info.regex(/Battle:[^(]+\(Rank ([0-9]+)\)/i);
			if (!uid || !info || (Battle.option.bp === 'Always' && myrank - rank > 5) || (Battle.option.bp === 'Never' && myrank - rank <= 5)) {
				return;
			}
			data[uid] = data[uid] || {};
			data[uid].name = $('a', el).text().trim();
			data[uid].level = info.regex(/\(Level ([0-9]+)\)/i);
			data[uid].rank = rank;
			data[uid].war = info.regex(/War:[^(]+\(Rank ([0-9]+)\)/i);
			data[uid].army = $('td.bluelink', el).next().text().regex(/([0-9]+)/);
			data[uid].align = $('img[src*="graphics/symbol_"]', el).attr('src').regex(/symbol_([0-9])/i);
		});
	}
	return false;
};

/***** Battle.update() *****
1. Delete targets who are now too high or too low in rank
2. If our target cache is longer than the user-set limit then prune it
2a. Add every target to an array
2b. Sort the array using weighted values - we want to keep people we win against etc
2c. While the list is too long, delete the extra entries
3. Check if we need to get Battle Points (points.length will be 0 if we don't)
4. Choose our next target
4a. If we don't want points and we want to fight in the arena, then skip
4b. If we don't want points and we want to fight monsters, then skip
4c. Loop through all preferred targets, and add them 10 times
4d. If we need to, now loop through all in target cache and add 1-5 times (more times for higher rank)
4e. Choose a random entry from our list (targets with more entries have more chance of being picked)
5. Update the Status line
*/
Battle.update = function(type) {
	var i, j, data = this.data.user, list = [], points = false, status = [], army = Player.get('army'), level = Player.get('level'), rank = Player.get('rank'), count = 0;
        var enabled = Queue.enabled(this);
	status.push('Rank ' + Player.get('rank') + ' ' + (Player.get('rank') && this.data.rank[Player.get('rank')].name) + ' with ' + addCommas(this.data.bp || 0) + ' Battle Points, Targets: ' + length(data) + ' / ' + this.option.cache);
	if (this.option.points !== 'Never') {
		status.push('Demi Points Earned Today: '
		+ '<img src="' + this.symbol[1] +'" alt=" " title="'+this.demi[1]+'" style="width:11px;height:11px;"> ' + (this.data.points[0] || 0) + '/10 '
		+ '<img src="' + this.symbol[2] +'" alt=" " title="'+this.demi[2]+'" style="width:11px;height:11px;"> ' + (this.data.points[1] || 0) + '/10 '
		+ '<img src="' + this.symbol[3] +'" alt=" " title="'+this.demi[3]+'" style="width:11px;height:11px;"> ' + (this.data.points[2] || 0) + '/10 '
		+ '<img src="' + this.symbol[4] +'" alt=" " title="'+this.demi[4]+'" style="width:11px;height:11px;"> ' + (this.data.points[3] || 0) + '/10 '
		+ '<img src="' + this.symbol[5] +'" alt=" " title="'+this.demi[5]+'" style="width:11px;height:11px;"> ' + (this.data.points[4] || 0) + '/10');
	}
	// First make check our target list doesn't need reducing
	for (i in data) { // Forget low or high rank - no points or too many points
		if ((this.option.bp === 'Always' && rank - (data[i].rank || 0) >= 4) || (this.option.bp === 'Never' && rank - (data[i].rank || 6) <= 5)) { // unknown rank never deleted
			delete data[i];
		}
	}
	if (length(data) > this.option.cache) { // Need to prune our target cache
//		debug('Pruning target cache');
		list = [];
		for (i in data) {
/*			weight = Math.range(-10, (data[i].win || 0) - (data[i].loss || 0), 20) / 2;
			if (Battle.option.bp === 'Always') { weight += ((data[i].rank || 0) - rank) / 2; }
			else if (Battle.option.bp === 'Never') { weight += (rank - (data[i].rank || 0)) / 2; }
			weight += Math.range(-1, (data[b].hide || 0) - (data[a].hide || 0), 1);
			weight += Math.range(-10, (((data[a].army || 0) - (data[b].army || 0)) / 10), 10);
			weight += Math.range(-10, (((data[a].level || 0) - (data[b].level || 0)) / 10), 10);
*/
			list.push(i);
		}
		list.sort(function(a,b) {
			var weight = 0;
				 if (((data[a].win || 0) - (data[a].loss || 0)) < ((data[b].win || 0) - (data[b].loss || 0))) { weight += 10; }
			else if (((data[a].win || 0) - (data[a].loss || 0)) > ((data[b].win || 0) - (data[b].loss || 0))) { weight -= 10; }
			if (Battle.option.bp === 'Always') { weight += ((data[b].rank || 0) - (data[a].rank || 0)) / 2; }
			if (Battle.option.bp === 'Never') { weight += ((data[a].rank || 0) - (data[b].rank || 0)) / 2; }
			weight += Math.range(-1, (data[b].hide || 0) - (data[a].hide || 0), 1);
			weight += Math.range(-10, (((data[a].army || 0) - (data[b].army || 0)) / 10), 10);
			weight += Math.range(-10, (((data[a].level || 0) - (data[b].level || 0)) / 10), 10);
			return weight;
		});
		while (list.length > this.option.cache) {
			delete data[list.pop()];
		}
	}
	// Check if we need Demi-points
        //debug('Queue Logic = ' + enabled);
	points = this.runtime.points = (this.option.points !== 'Never' && this.data.points && sum(this.data.points) < 50 && enabled);
	// Second choose our next target
/*	if (!points.length && this.option.arena && Arena.option.enabled && Arena.runtime.attacking) {
		this.runtime.attacking = null;
		status.push('Battling in the Arena');
	} else*/
	if (!points && this.option.monster && (Monster.get('runtime.attack',false) || Monster.get('runtime.fortify',false))) {
		this.runtime.attacking = null;
		status.push('Attacking Monsters');
	} else {
		if (!this.runtime.attacking || !data[this.runtime.attacking]
		|| (this.option.army !== 'Any' && (data[this.runtime.attacking].army / army) > this.option.army)
		|| (this.option.level !== 'Any' && (data[this.runtime.attacking].level / level) > this.option.level)) {
			this.runtime.attacking = null;
		}
		list = [];
		for(j=0; j<this.option.prefer.length; j++) {
			i = this.option.prefer[j];
			if (!/[^0-9]/g.test(i)) {
				data[i] = data[i] || {};
				if ((data[i].dead && data[i].dead + 300000 >= Date.now()) // If they're dead ignore them for 1hp = 5 mins
				|| (data[i].last && data[i].last + this.option.between >= Date.now()) // If we're spacing our attacks
				|| (typeof this.option.losses === 'number' && (data[i].loss || 0) - (data[i].win || 0) >= this.option.losses) // Don't attack someone who wins more often
				|| (points && (!data[i].align || this.data.points[data[i].align - 1] >= 10))) {
					continue;
				}
				list.push(i,i,i,i,i,i,i,i,i,i); // If on the list then they're worth at least 10 ;-)
				count++;
			}
		}
		if (this.option.preferonly === 'Never' || this.option.preferonly === 'Sometimes' || (this.option.preferonly === 'Only' && !this.option.prefer.length) || (this.option.preferonly === 'Until Dead' && !list.length)) {
			for (i in data) {
				if ((data[i].dead && data[i].dead + 1800000 >= Date.now()) // If they're dead ignore them for 3m * 10hp = 30 mins
				|| (data[i].last && data[i].last + this.option.between >= Date.now()) // If we're spacing our attacks
				|| (typeof this.option.losses === 'number' && (data[i].loss || 0) - (data[i].win || 0) >= this.option.losses) // Don't attack someone who wins more often
				|| (this.option.army !== 'Any' && ((data[i].army || 0) / army) > this.option.army && this.option.type === 'Invade')
				|| (this.option.level !== 'Any' && ((data[i].level || 0) / level) > this.option.level && this.option.type !== 'Invade')
				|| (points && (!data[i].align || this.data.points[data[i].align - 1] >= 10))) {
					continue;
				}
				if (Battle.option.bp === 'Always') {
					for (j=Math.range(1,(data[i].rank || 0)-rank+1,5); j>0; j--) { // more than 1 time if it's more than 1 difference
						list.push(i);
					}
				} else {
					list.push(i);
				}
				count++;
			}
		}
		if (!this.runtime.attacking && list.length) {
			this.runtime.attacking = list[Math.floor(Math.random() * list.length)];
		}
		if (this.runtime.attacking) {
			i = this.runtime.attacking;
			status.push('Next Target: <img src="' + this.symbol[data[i].align] +'" alt=" " title="'+this.demi[data[i].align]+'" style="width:11px;height:11px;"> ' + data[i].name + ' (Level ' + data[i].level + (data[i].rank && this.data.rank[data[i].rank] ? ' ' + this.data.rank[data[i].rank].name : '') + ' with ' + data[i].army + ' army)' + (count ? ', ' + count + ' valid target' + plural(count) : ''));
		} else {
			this.runtime.attacking = null;
			status.push('No valid targets found');
			this._remind(60); // No targets, so check again in 1 minute...
		}
	}
	Dashboard.status(this, status.join('<br>'));
};

/***** Battle.work() *****
1. If we don't have a target, not enough health, or not enough stamina, return false
2. Otherwise
2a. Ask to work
2b. Get the correct General
2c. Go to the right page
3. Select our target
3a. Replace the first target on the page with the target we want to attack
3b. If we can't find any targets to replace / attack then force a reload
3c. Click the Invade / Dual attack button
*/
Battle.work = function(state) {
	if (!this.runtime.attacking || Player.get('health') < (this.option.risk ? 10 : 13) || Queue.burn.stamina < (!this.runtime.points && this.option.type === 'War' ? 10 : 1)) {
//		debug('Not attacking because: ' + (this.runtime.attacking ? '' : 'No Target, ') + 'Health: ' + Player.get('health') + ' (must be >=10), Burn Stamina: ' + Queue.burn.stamina + ' (must be >=1)');
		return QUEUE_FINISH;
	}
	if (!state || !Generals.to(this.option.general ? (this.runtime.points ? this.option.points : this.option.type) : this.option.general_choice) || !Page.to('battle_battle')) {
		return QUEUE_CONTINUE;
	}
	var $symbol_rows = $('#app'+APPID+'_app_body table.layout table table tr:even').has('img[src*="graphics/symbol_'+this.data.user[this.runtime.attacking].align+'"]');
	var $form = $('form input[alt="' + (this.runtime.points ? this.option.points : this.option.type) + '"]', $symbol_rows).first().parents('form');
	if (!$form.length) {
		debug('Unable to find ' + (this.runtime.points ? this.option.points : this.option.type) + ' button, forcing reload');
		Page.to('index');
	} else {
		log((this.runtime.points ? this.option.points : this.option.type) + ' ' + this.data.user[this.runtime.attacking].name + ' (' + this.runtime.attacking + ')');
		$('input[name="target_id"]', $form).attr('value', this.runtime.attacking);
		Page.click($('input[type="image"]', $form));
	}
	return QUEUE_RELEASE;
};

Battle.rank = function(name) {
	for (var i in Battle.data.rank) {
		if (Battle.data.rank[i].name === name) {
			return parseInt(i, 10);
		}
	}
	return 0;
};

Battle.order = [];
Battle.dashboard = function(sort, rev) {
	var i, o, points = [0, 0, 0, 0, 0, 0], list = [], output = [], sorttype = ['align', 'name', 'level', 'rank', 'army', 'win', 'loss', 'hide'], data = this.data.user, army = Player.get('army'), level = Player.get('level');
	for (i in data) {
		points[data[i].align]++;
	}
	if (typeof sort === 'undefined') {
		this.order = [];
		for (i in data) {
			this.order.push(i);
		}
	}
	if (typeof sort === 'undefined') {
		sort = (this.runtime.sort || 1);
	}
	if (typeof rev === 'undefined'){
		rev = (this.runtime.rev || false);
	}
	this.runtime.sort = sort;
	this.runtime.rev = rev;
	if (typeof sorttype[sort] === 'string') {
		this.order.sort(function(a,b) {
			var aa = (data[a][sorttype[sort]] || 0), bb = (data[b][sorttype[sort]] || 0);
			if (typeof aa === 'string' || typeof bb === 'string') {
				return (rev ? (''+bb).localeCompare(aa) : (''+aa).localeCompare(bb));
			}
			return (rev ? aa - bb : bb - aa);
		});
	}
	list.push('<div style="text-align:center;"><strong>Rank:</strong> ' + this.data.rank[Player.get('rank')].name + ' (' + Player.get('rank') + '), <strong>Targets:</strong> ' + length(data) + ' / ' + this.option.cache + ', <strong>By Alignment:</strong>');
	for (i=1; i<6; i++ ) {
		list.push(' <img src="' + this.symbol[i] +'" alt="'+this.demi[i]+'" title="'+this.demi[i]+'" style="width:11px;height:11px;"> ' + points[i]);
	}
	list.push('</div><hr>');
	th(output, 'Align');
	th(output, 'Name');
	th(output, 'Level');
	th(output, 'Rank');
	th(output, 'Army');
	th(output, 'Wins');
	th(output, 'Losses');
	th(output, 'Hides');
	list.push('<table cellspacing="0" style="width:100%"><thead><tr>' + output.join('') + '</tr></thead><tbody>');
	for (o=0; o<this.order.length; o++) {
		data = this.data.user[this.order[o]];
		output = [];
		td(output, isNumber(data.align) ? '<img src="' + this.symbol[data.align] + '" alt="' + this.demi[data.align] + '">' : '', isNumber(data.align) ? 'title="' + this.demi[data.align] + '"' : null);
		th(output, data.name, 'title="'+this.order[o]+'"');
		td(output, (this.option.level !== 'Any' && (data.level / level) > this.option.level) ? '<i>'+data.level+'</i>' : data.level);
		td(output, this.data.rank[data.rank] ? this.data.rank[data.rank].name : '');
		td(output, (this.option.army !== 'Any' && (data.army / army) > this.option.army) ? '<i>'+data.army+'</i>' : data.army);
		td(output, data.win || '');
		td(output, data.loss || '');
		td(output, data.hide || '');
		tr(list, output.join(''));
	}
	list.push('</tbody></table>');
	$('#golem-dashboard-Battle').html(list.join(''));
	$('#golem-dashboard-Battle tbody tr td:nth-child(2)').css('text-align', 'left');
	if (typeof sort !== 'undefined') {
		$('#golem-dashboard-Battle thead th:eq('+sort+')').attr('name',(rev ? 'reverse' : 'sort')).append('&nbsp;' + (rev ? '&uarr;' : '&darr;'));
	}
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page:true, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Blessing **********
* Automatically receive blessings
*/
var Blessing = new Worker('Blessing');
Blessing.data = null;

Blessing.defaults['castle_age'] = {
	pages:'oracle_demipower'
};

Blessing.option = {
	which:'Stamina',
        display: false
};

Blessing.runtime = {
	when:0
};

Blessing.which = ['None', 'Energy', 'Attack', 'Defense', 'Health', 'Stamina'];
Blessing.display = [
    {
	id:'which',
	label:'Which',
	select:Blessing.which
    },{
        id:'display',
        label:'Display in Blessing info on *',
        checkbox:true
    }
];

Blessing.parse = function(change) {
	var result = $('div.results'), time;
	if (result.length) {
		time = result.text().regex(/Please come back in: ([0-9]+) hours and ([0-9]+) minutes/i);
		if (time && time.length) {
			this.runtime.when = Date.now() + (((time[0] * 60) + time[1] + 1) * 60000);
		} else if (result.text().match(/You have paid tribute to/i)) {
			this.runtime.when = Date.now() + 86460000; // 24 hours and 1 minute
		}
	}
	return false;
};

Blessing.update = function(){
    var d, demi;
     if (this.option.display && this.option.which !== 'None'){
         d = new Date(this.runtime.when);
         switch(this.option.which){
             case 'Energy':
                 demi = 'Ambrosia (' + this.option.which + ')';
                 break;
             case 'Attack':
                 demi = 'Malekus (' + this.option.which + ')';
                 break;
             case 'Defense':
                 demi = 'Corvintheus (' + this.option.which + ')';
                 break;
             case 'Defense':
                 demi = 'Corvintheus (' + this.option.which + ')';
                 break;
             case 'Health':
                 demi = 'Aurora (' + this.option.which + ')';
                 break;
             case 'Stamina':
                 demi = 'Azeron (' + this.option.which + ')';
                 break;
             default:
                 demi = 'Unknown';
                 break;
         }
         Dashboard.status(this, '<span title="Next Blessing">' + 'Next Blessing performed on ' + d.format('l g:i a') + ' to ' + demi + ' </span>');
     } else {
         Dashboard.status(this);
     }
};

Blessing.work = function(state) {
	if (!this.option.which || this.option.which === 'None' || Date.now() <= this.runtime.when) {
		return QUEUE_FINISH;
	}
	if (!state || !Page.to('oracle_demipower')) {
		return QUEUE_CONTINUE;
	}
	Page.click('#app'+APPID+'_symbols_form_'+this.which.indexOf(this.option.which)+' input.imgButton');
	return QUEUE_RELEASE;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page:true, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Elite() **********
* Build your elite army
*/
var Elite = new Worker('Elite');
Elite.data = {};

Elite.defaults['castle_age'] = {
	pages:'keep_eliteguard army_viewarmy'
};

Elite.option = {
//	elite:true,
	every:12,
	armyperpage:25 // Read only, but if they change it and I don't notice...
};

Elite.runtime = {
	armylastpage:1,
	armyextra:0,
	waitelite:0,
	nextelite:0
};

Elite.display = [
	{
		id:'elite',
		label:'Fill Elite Guard',
		checkbox:true
	},{
		id:'every',
		label:'Every',
		select:[1, 2, 3, 6, 12, 24],
		after:'hours',
		help:'Although people can leave your Elite Guard after 24 hours, after 12 hours you can re-confirm them'
	},{
		id:'fill',
		label:'Fill Now',
		button:true
	}
];

Elite.init = function() { // Convert old elite guard list
	if (length(this.data)) {
		for (var i in this.data) {
			Army.set(['_info', i, 'name'], this.data[i].name);
			Army.set(['_info', i, 'level'], this.data[i].level);
			Army.set(['Army', i], true); // Set for people in our actual army
			if (this.data[i].elite) {
				Army.set([i, 'elite'], this.data[i].elite);
			}
		}
	}
	this.data = {}; // Will set to null at some later date

	Army.section(this.name, {
		'key':'Elite',
		'name':'Elite',
		'show':'Elite',
		'label':function(data,uid){
			return ('Elite' in data[uid]
				? ('prefer' in data[uid]['Elite'] && data[uid]['Elite']['prefer']
					? '<img src="' + Images.star_on + '">'
					: '<img src="' + Images.star_off + '">')
				 + ('elite' in data[uid]['Elite'] && data[uid]['Elite']['elite']
					? ' <img src="' + Images.timer + '" title="Member until: ' + makeTime(data[uid]['Elite']['elite']) + '">'
					: '')
				 + ('full' in data[uid]['Elite'] && data[uid]['Elite']['full']
					? ' <img src="' + Images.timer_red + '" title="Full until: ' + makeTime(data[uid]['Elite']['full']) + '">'
					: '')
				: ('Army' in data[uid] && data[uid]['Army']
					? '<img src="' + Images.star_off + '">'
					: '')
				);
		},
		'sort':function(data,uid){
			if (!('Elite' in data[uid]) && !('Army' in data[uid]) && !data[uid]['Army']) {
				return 0;
			}
			return (('prefer' in data[uid]['Elite'] && data[uid]['Elite']['prefer']
					? Date.now()
					: 0)
				+ ('elite' in data[uid]['Elite']
					? Date.now() - parseInt(data[uid]['Elite']['elite'], 10)
					: 0)
				+ ('full' in data[uid]['Elite']
					? Date.now() - parseInt(data[uid]['Elite']['full'], 10)
					: 0));
		},
		'click':function(data,uid){
			if (Army.get(['Elite',uid,'prefer'], false)) {
				Army.set(['Elite',uid,'prefer']);
			} else {
				Army.set(['Elite',uid,'prefer'], true);
			}
			return true;
		}
	});
	
	$('#'+Config.makeID(this,'fill')).live('click',function(i,el){
		Elite.set('runtime.waitelite', 0);
		Elite._save('runtime');
	});
};

Elite.parse = function(change) {
	$('span.result_body').each(function(i,el){
		var txt = $(el).text();
/*Arena possibly gone for good
		if (Elite.runtime.nextarena) {
			if (txt.match(/has not joined in the Arena!/i)) {
				Army.set([Elite.runtime.nextarena, 'arena'], -1);
			} else if (txt.match(/Arena Guard, and they have joined/i)) {
				Army.set([Elite.runtime.nextarena, 'arena'], Date.now() + 43200000); // 12 hours
			} else if (txt.match(/'s Arena Guard is FULL/i)) {
				Army.set([Elite.runtime.nextarena, 'arena'], Date.now() + 1800000); // half hour
			} else if (txt.match(/YOUR Arena Guard is FULL/i)) {
				Elite.runtime.waitarena = Date.now();
				debug(this + 'Arena guard full, wait '+Elite.option.every+' hours');
			}
		}
*/
		if (txt.match(/Elite Guard, and they have joined/i)) {
			Army.set([$('img', el).attr('uid'), 'elite'], Date.now() + 86400000); // 24 hours
			Elite.runtime.nextelite = null;
		} else if (txt.match(/'s Elite Guard is FULL!/i)) {
			Army.set([$('img', el).attr('uid'), 'full'], Date.now() + 1800000); // half hour
			Elite.runtime.nextelite = null;
		} else if (txt.match(/YOUR Elite Guard is FULL!/i)) {
			Elite.runtime.waitelite = Date.now();
			Elite.runtime.nextelite = null;
			debug('Elite guard full, wait '+Elite.option.every+' hours');
		}
	});
	if (Page.page === 'army_viewarmy') {
		var count = 0;
		$('img[linked="true"][size="square"]').each(function(i,el){
			var uid = $(el).attr('uid'), who = $(el).parent().parent().next();
			count++;
			Army.set(['Army', uid], true); // Set for people in our actual army
			Army.set(['_info', uid, 'name'], $('a', who).text());
			Army.set(['_info', uid, 'level'], $(who).text().regex(/([0-9]+) Commander/i));
		});
		if (count < 25) {
			this.runtime.armyextra = Player.get('armymax') - length(this.data) - 1;
		}
	}
	return false;
};

Elite.update = function(type,worker) {
	var i, list, tmp = [], now = Date.now(), check;
	this.runtime.nextelite = null;
	if (Queue.enabled(this)) {
		list = Army.get('Elite');// Try to keep the same guards
		for(i=0; i<list.length; i++) {
			check = Army.get([list[i],'elite'], 0) || Army.get([list[i],'full'], 0);
			if (check < now) {
				Army.set([list[i],'elite']);// Delete the old timers if they exist...
				Army.set([list[i],'full']);// Delete the old timers if they exist...
				if (Army.get([list[i],'prefer'], false)) {// Prefer takes precidence
					this.runtime.nextelite = list[i];
					break;
				}
				this.runtime.nextelite = this.runtime.nextelite || list[i];// Earlier in our army rather than later
			}
		}
		if (!this.runtime.nextelite) {
			list = Army.get('Army');// Otherwise lets just get anyone in the army
			for(i=0; i<list.length; i++) {
				if (!Army.get([list[i]], false)) {// Only try to add a non-member who's not already added
					this.runtime.nextelite = list[i];
					break;
				}
			}
		}
		check = (this.runtime.waitelite + (this.option.every * 3600000));
		tmp.push('Elite Guard: Check' + (check < now ? 'ing now' : ' in <span class="golem-time" name="' + check + '">' + makeTimer((check - now) / 1000) + '</span>') + (this.runtime.nextelite ? ', Next: '+Army.get(['_info', this.runtime.nextelite, 'name']) : ''));
	}
	Dashboard.status(this, tmp.join('<br>'));
};

Elite.work = function(state) {
	if (Math.ceil((Player.get('armymax') - this.runtime.armyextra - 1) / this.option.armyperpage) > this.runtime.armylastpage) {
		if (state) {
			debug('Filling army list');
			this.runtime.armylastpage = Math.max(this.runtime.armylastpage + 1, Math.ceil((length(Army.get('Army')) + 1) / this.option.armyperpage));
			Page.to('army_viewarmy', {page:this.runtime.armylastpage});
		}
		return true;
	}
	if (!this.option.elite || !this.runtime.nextelite || (this.runtime.waitelite + (this.option.every * 3600000)) > Date.now()) {
		return false;
	}
	if (!state) {
		return true;
	}
	if ((this.runtime.waitelite + (this.option.every * 3600000)) <= Date.now()) {
		debug('Add ' + Army.get(['_info', this.runtime.nextelite, 'name'], this.runtime.nextelite) + ' to Elite Guard');
		if (!Page.to('keep_eliteguard', {twt:'jneg' , jneg:true, user:this.runtime.nextelite})) {
			return true;
		}
	}
	return false;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals:true, Idle, LevelUp, Player, Town,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Generals **********
* Updates the list of Generals
* Finds best General for other classes
* *** Need to take into account army size and real stats for attack and defense
*/
var Generals = new Worker('Generals');
Generals.option = null;
Generals.data = {};

Generals.defaults['castle_age'] = {
	pages:'* heroes_generals'
};

Generals.runtime = {
	disabled:false, // Nobody should touch this except LevelUp!!!
	armymax:1 // Don't force someone with a small army to buy a whole load of exrta items...
};

Generals.init = function() {
	for (var i in this.data) {
		if (i.indexOf('\t') !== -1) { // Fix bad page loads...
			delete this.data[i];
		}
	}
	if (!Player.get('attack') || !Player.get('defense')) {
		this._watch(Player); // Only need them the first time...
	}
	this._watch(Town);
};

Generals.parse = function(change) {
	if ($('div.results').text().match(/has gained a level!/i)) {
		this.data[Player.get('general')].level++; // Our stats have changed but we don't care - they'll update as soon as we see the Generals page again...
	}
	if (Page.page === 'heroes_generals') {
		var $elements = $('.generalSmallContainer2'), data = this.data, weapon_bonus = '', current = $('div.general_name_div3').first().text().trim();

		$('div[style*="model_items.jpg"] img[title]').each(function(i){
			var temp = $(this).attr('title');
			if (temp && temp.indexOf("[not owned]") === -1){
				if (weapon_bonus.length) {
					weapon_bonus += ', ';
				}
				weapon_bonus += temp.replace(/\<[^>]*\>|\s+|\n/g,' ').trim();
				//debug("Found weapon: " + temp.replace(/\<[^>]*\>|\s+|\n/g,' ').trim());
			}
		});
		if (data[current]){
			data[current].weaponbonus = weapon_bonus;
		}
// Hopefully our Page.to() logic now catches most bad page loads and removes the need for this...
//		if ($elements.length < length(data)) {
//			debug('Different number of generals, have '+$elements.length+', want '+length(data));
//			Page.to('heroes_generals', ''); // Force reload
//			return false;
//		}
		$elements.each(function(i,el){
			var name = $('.general_name_div3_padding', el).text().trim(), level = parseInt($(el).text().regex(/Level ([0-9]+)/i), 10), progress = parseInt($('div.generals_indv_stats', el).next().children().children().children().next().attr('style').regex(/width: ([0-9]*\.*[0-9]*)%/i), 10);
			if (name && name.indexOf('\t') === -1 && name.length < 30) { // Stop the "All generals in one box" bug
//				if (!data[name] || data[name].level !== level || data[name].progress !== progress) {
					data[name] = data[name] || {};
					data[name].id		= $('input[name=item]', el).val();
					data[name].type		= $('input[name=itype]', el).val();
					data[name].img		= $('.imgButton', el).attr('src').filepart();
					data[name].att		= $('.generals_indv_stats_padding div:eq(0)', el).text().regex(/([0-9]+)/);
					data[name].def		= $('.generals_indv_stats_padding div:eq(1)', el).text().regex(/([0-9]+)/);
					data[name].progress	= progress;
					data[name].level	= level; // Might only be 4 so far, however...
					data[name].skills	= $('table div', el).html().replace(/\<[^>]*\>|\s+|\n/g,' ').trim();
					if (level >= 4){	// If we just leveled up to level 4, remove the priority
						if (data[name].priority) {
							delete data[name].priority;
						}
					}
//				}
			}
		});
	}
	return false;
};

Generals.update = function(type, worker) {
	var data = this.data, i, priority_list = [], list = [], invade = Town.get('runtime.invade'), duel = Town.get('runtime.duel'), attack, attack_bonus, defend, defense_bonus, army, gen_att, gen_def, attack_potential, defense_potential, att_when_att_potential, def_when_att_potential, att_when_att = 0, def_when_att = 0, monster_att = 0, monster_multiplier = 1, current_att, current_def, listpush = function(list,i){list.push(i);}, skillcombo;
	if (!type || type === 'data') {
		for (i in Generals.data) {
			list.push(i);
		}
		// "any" MUST remain lower case - all real generals are capitalised so this provides the first and most obvious difference
		Config.set('generals', ['any','under level 4'].concat(list.sort())); 
	}
	
	// Take all existing priorities and change them to rank starting from 1 and keeping existing order.
	for (i in data) {
		if (data[i].level < 4) {
			priority_list.push([i, data[i].priority]);
		}
	}
	priority_list.sort(function(a,b) {
		return (a[1] - b[1]);
	});
	for (i in priority_list){
		data[priority_list[i][0]].priority = parseInt(i, 10)+1;
	}
	this.runtime.max_priority = priority_list.length;
	// End Priority Stuff
	
	if ((type === 'data' || worker === Town || worker === Player) && invade && duel) {
		if (worker === Player && Player.get('attack') && Player.get('defense')) {
			this._unwatch(Player); // Only need them the first time...
		}
		for (i in data) {
			skillcombo = data[i].skills + (data[i].weaponbonus || '');
			attack_bonus = Math.floor(sum(skillcombo.regex(/([-+]?[0-9]*\.?[0-9]*) Player Attack|Increase Player Attack by ([0-9]+)|Convert ([-+]?[0-9]*\.?[0-9]*) Attack/i)) + ((data[i].skills.regex(/Increase ([-+]?[0-9]*\.?[0-9]*) Player Attack for every Hero Owned/i) || 0) * (length(data)-1)));
			defense_bonus = Math.floor(sum(skillcombo.regex(/([-+]?[0-9]*\.?[0-9]*) Player Defense|Increase Player Defense by ([0-9]+)/i))	+ ((data[i].skills.regex(/Increase ([-+]?[0-9]*\.?[0-9]*) Player Defense for every Hero Owned/i) || 0) * (length(data)-1)));
			attack = Player.get('attack') + attack_bonus;
			defend = Player.get('defense') + defense_bonus;
			attack_potential = Player.get('attack') + (attack_bonus * 4) / data[i].level;	// Approximation
			defense_potential = Player.get('defense') + (defense_bonus * 4) / data[i].level;	// Approximation
			army = Math.min(Player.get('armymax'),(skillcombo.regex(/Increases? Army Limit to ([0-9]+)/i) || 501));
			gen_att = getAttDef(data, listpush, 'att', Math.floor(army / 5));
			gen_def = getAttDef(data, listpush, 'def', Math.floor(army / 5));
			att_when_att = (skillcombo.regex(/Increase Player Attack when Defending by ([-+]?[0-9]+)/i) || 0);
			def_when_att = (skillcombo.regex(/([-+]?[0-9]+) Defense when attacked/i) || 0);
			att_when_att_potential = (att_when_att * 4) / data[i].level;	// Approximation
			def_when_att_potential = (def_when_att * 4) / data[i].level;	// Approximation
			monster_att = (skillcombo.regex(/([-+]?[0-9]+) Monster attack/i) || 0);
			monster_multiplier = 1+ (skillcombo.regex(/([-+]?[0-9]+)% Critical/i) || 0)/100;
			current_att = data[i].att + parseInt((data[i].skills.regex(/'s Attack by ([-+]?[0-9]+)/i) || 0), 10) + (typeof data[i].weaponbonus !== 'undefined' ? parseInt((data[i].weaponbonus.regex(/([-+]?[0-9]+) attack/i) || 0), 10) : 0);	// Need to grab weapon bonuses without grabbing Serene's skill bonus
			current_def = data[i].def + (typeof data[i].weaponbonus !== 'undefined' ? parseInt((data[i].weaponbonus.regex(/([-+]?[0-9]+) defense/i) || 0), 10) : 0);
//			debug(i + ' attack: ' + current_att + ' = ' + data[i].att + ' + ' + parseInt((data[i].skills.regex(/'s Attack by ([-+]?[0-9]+)/i) || 0)) + ' + ' + parseInt((data[i].weaponbonus.regex(/([-+]?[0-9]+) attack/i) || 0)));
			data[i].invade = {
				att: Math.floor(invade.attack + current_att + (current_def * 0.7) + ((attack + (defend * 0.7)) * army) + gen_att),
				def: Math.floor(invade.defend + current_def + (current_att * 0.7) + ((defend + def_when_att + ((attack + att_when_att) * 0.7)) * army) + gen_def)
			};
			data[i].duel = {
				att: Math.floor(duel.attack + current_att + (current_def * 0.7) + attack + (defend * 0.7)),
				def: Math.floor(duel.defend + current_def + (current_att * 0.7) + defend + def_when_att + ((attack + att_when_att) * 0.7))
			};
			data[i].monster = {
				att: Math.floor(monster_multiplier * (duel.attack + current_att + attack + monster_att)),
				def: Math.floor(duel.defend + current_def + defend) // Fortify, so no def_when_att
			};
			data[i].potential = {
				bank: (skillcombo.regex(/Bank Fee/i) ? 1 : 0),
				defense: Math.floor(duel.defend + (data[i].def + 4 - data[i].level) + ((data[i].att + 4 - data[i].level) * 0.7) + defense_potential + def_when_att_potential + ((attack_potential + att_when_att_potential) * 0.7)),
				income: (skillcombo.regex(/Increase Income by ([0-9]+)/i) * 4) / data[i].level,
				invade: Math.floor(invade.attack + (data[i].att + 4 - data[i].level) + ((data[i].def + 4 - data[i].level) * 0.7) + ((attack_potential + (defense_potential * 0.7)) * army) + gen_att),
				duel: Math.floor(duel.attack + (data[i].att + 4 - data[i].level) + ((data[i].def + 4 - data[i].level) * 0.7) + attack_potential + (defense_potential * 0.7)),
				monster: Math.floor(duel.attack + (data[i].att + 4 - data[i].level) + attack_potential + (monster_att * 4) / data[i].level),
				raid_invade: 0,
				raid_duel: 0,
				influence: (skillcombo.regex(/Influence ([0-9]+)% Faster/i) || 0),
				drops: (skillcombo.regex(/Chance ([0-9]+)% Drops/i) || 0),
				demi: (skillcombo.regex(/Extra Demi Points/i) ? 1 : 0),
				cash: (skillcombo.regex(/Bonus ([0-9]+) Gold/i) || 0)
			};
			data[i].potential.raid_invade = (data[i].potential.defense + data[i].potential.invade);
			data[i].potential.raid_duel = (data[i].potential.defense + data[i].potential.duel);

			this.runtime.armymax = Math.max(army, this.runtime.armymax);
		}
	}
};

Generals.to = function(name) {
	if (this.runtime.disabled) {
		return true;
	}
	this._unflush();
	if (name) {
		name = this.best(name);
	}
	if (!name || Player.get('general') === name || name.toLowerCase() === 'any') {
		return true;
	}
	if (!this.data[name]) {
		log('General "'+name+'" requested but not found!');
		return true; // Not found, so fake it
	}
	debug('Changing to General '+name);
	Page.to('heroes_generals', this.data[name].id && this.data[name].type ? {item:this.data[name].id, itype:this.data[name].type} : null)
	return false;
};

Generals.best = function(type) {
	this._unflush();
	if (this.data[type]) {
		return type;
	}
	var rx = '', best = null, bestval = 0, i, value, current = Player.get('general');
	switch(type.toLowerCase()) {
	case 'cost':		rx = /Decrease Soldier Cost by ([0-9]+)/i; break;
	case 'stamina':		rx = /Increase Max Stamina by ([0-9]+)|\+([0-9]+) Max Stamina/i; break;
	case 'energy':		rx = /Increase Max Energy by ([0-9]+)|\+([0-9]+) Max Energy/i; break;
	case 'income':		rx = /Increase Income by ([0-9]+)/i; break;
	case 'item':		rx = /([0-9]+)% Drops for Quest/i; break;
	case 'influence':	rx = /Bonus Influence ([0-9]+)/i; break;
	case 'defense':		rx = /([-+]?[0-9]+) Player Defense/i; break;
	case 'cash':		rx = /Bonus ([0-9]+) Gold/i; break;
	case 'bank':		return 'Aeris';
	case 'war':			rx = /\+([0-9]+) Attack to your entire War Council|-([0-9]+) Attack to your opponents War Council/i; break;
	case 'invade':
		for (i in this.data) {
			if (!best || (this.data[i].invade && this.data[i].invade.att > this.data[best].invade.att) || (this.data[i].invade && this.data[i].invade.att === this.data[best].invade.att && best !== current)) {
				best = i;
			}
		}
		return (best || 'any');
	case 'duel':
		for (i in this.data) {
			if (!best || (this.data[i].duel && this.data[i].duel.att > this.data[best].duel.att) || (this.data[i].duel && this.data[i].duel.att === this.data[best].duel.att && best !== current)) {
				best = i;
			}
		}
		return (best || 'any');
	case 'raid-invade':
		for (i in this.data) {
			if (!best || (this.data[i].invade && (this.data[i].invade.att) > (this.data[best].invade.att))) {
				best = i;
			}
		}
		return (best || 'any');
	case 'raid-duel':
		for (i in this.data) {
			if (!best || (this.data[i].duel && (this.data[i].duel.att) > (this.data[best].duel.att))) {
				best = i;
			}
		}
		return (best || 'any');
	case 'monster_attack': 
		for (i in this.data) {
			if (!best || (this.data[i].monster && this.data[i].monster.att > this.data[best].monster.att)) {
				best = i;
			}
		}
		return (best || 'any');
	case 'dispel':
	case 'monster_defend': 
		for (i in this.data) {
			if (!best || (this.data[i].monster && this.data[i].monster.def > this.data[best].monster.def)) {
				best = i;
			}
		}
		return (best || 'any');
	case 'defend':
		for (i in this.data) {
			if (!best || (this.data[i].duel && (this.data[i].duel.def > this.data[best].duel.def) || (this.data[i].duel.def === this.data[best].duel.def && best !== current))) {
				best = i;
			}
		}
		return (best || 'any');
	case 'under level 4':
		for (i in this.data){
			if (this.data[i].priority === 1){
				return i;
			}
		}
		return 'any';
	default:
		return 'any';
	}
	for (i in this.data) {
		value = sum(this.data[i].skills.regex(rx));
		if (value) {
			if (!best || value>bestval) {
				best = i;
				bestval = value;
			}
		}
	}
//	if (best) {
//		debug('Best general found: '+best);
//	}
	return (best || 'any');
};

Generals.order = [];
Generals.dashboard = function(sort, rev) {
	var i, o, output = [], list = [], iatt = 0, idef = 0, datt = 0, ddef = 0, matt = 0, mdef = 0;

	if (typeof sort === 'undefined') {
		Generals.order = [];
		for (i in Generals.data) {
			Generals.order.push(i);
		}
	}
	if (typeof sort === 'undefined') {
		sort = (this.runtime.sort || 1);
	}
	if (typeof rev === 'undefined'){
		rev = (this.runtime.rev || false);
	}
	this.runtime.sort = sort;
	this.runtime.rev = rev;
	if (typeof sort !== 'undefined') {
		Generals.order.sort(function(a,b) {
			var aa, bb, type, x;
			if (sort === 1) {
				aa = a;
				bb = b;
			} else if (sort === 2) {
				aa = (Generals.data[a].level || 0);
				bb = (Generals.data[b].level || 0);
			} else if (sort === 3) {
				aa = (Generals.data[a].priority || 999999);
				bb = (Generals.data[b].priority || 999999);
			} else {
				type = (sort<6 ? 'invade' : (sort<8 ? 'duel' : 'monster'));
				x = (sort%2 ? 'def' : 'att');
				aa = (Generals.data[a][type] ? (Generals.data[a][type][x] || 0) : 0);
				bb = (Generals.data[b][type] ? (Generals.data[b][type][x] || 0) : 0);
			}
			if (typeof aa === 'string' || typeof bb === 'string') {
				return (rev ? (''+bb).localeCompare(aa) : (''+aa).localeCompare(bb));
			}
			return (rev ? aa - bb : bb - aa);
		});
	}
	for (i in Generals.data) {
		iatt = Math.max(iatt, Generals.data[i].invade ? Generals.data[i].invade.att : 1);
		idef = Math.max(idef, Generals.data[i].invade ? Generals.data[i].invade.def : 1);
		datt = Math.max(datt, Generals.data[i].duel ? Generals.data[i].duel.att : 1);
		ddef = Math.max(ddef, Generals.data[i].duel ? Generals.data[i].duel.def : 1);
		matt = Math.max(matt, Generals.data[i].monster ? Generals.data[i].monster.att : 1);
		mdef = Math.max(mdef, Generals.data[i].monster ? Generals.data[i].monster.def : 1);
	}
	list.push('<table cellspacing="0" style="width:100%"><thead><tr><th></th><th>General</th><th>Level</th><th>Quest<br>Rank</th><th>Invade<br>Attack</th><th>Invade<br>Defend</th><th>Duel<br>Attack</th><th>Duel<br>Defend</th><th>Monster<br>Attack</th><th>Fortify<br>Dispel</th></tr></thead><tbody>');
	for (o=0; o<Generals.order.length; o++) {
		i = Generals.order[o];
		output = [];
		output.push('<img src="' + imagepath + Generals.data[i].img+'" style="width:25px;height:25px;" title="Skills: ' + Generals.data[i].skills + ', Weapon Bonus: ' + (typeof Generals.data[i].weaponbonus !== 'unknown' ? (Generals.data[i].weaponbonus ? Generals.data[i].weaponbonus : 'none') : 'unknown') + '">');
		output.push(i);
		output.push('<div'+(isNumber(Generals.data[i].progress) ? ' title="'+Generals.data[i].progress+'%"' : '')+'>'+Generals.data[i].level+'</div><div style="background-color: #9ba5b1; height: 2px; width=100%;"><div style="background-color: #1b3541; float: left; height: 2px; width: '+(Generals.data[i].progress || 0)+'%;"></div></div>');
		output.push(Generals.data[i].priority ? ((Generals.data[i].priority !== 1 ? '<a class="golem-moveup" name='+Generals.data[i].priority+'>&uarr</a> ' : '&nbsp;&nbsp; ') + Generals.data[i].priority + (Generals.data[i].priority !== this.runtime.max_priority ? ' <a class="golem-movedown" name='+Generals.data[i].priority+'>&darr</a>' : ' &nbsp;&nbsp;')) : '');
		output.push(Generals.data[i].invade ? (iatt === Generals.data[i].invade.att ? '<strong>' : '') + addCommas(Generals.data[i].invade.att) + (iatt === Generals.data[i].invade.att ? '</strong>' : '') : '?');
		output.push(Generals.data[i].invade ? (idef === Generals.data[i].invade.def ? '<strong>' : '') + addCommas(Generals.data[i].invade.def) + (idef === Generals.data[i].invade.def ? '</strong>' : '') : '?');
		output.push(Generals.data[i].duel ? (datt === Generals.data[i].duel.att ? '<strong>' : '') + addCommas(Generals.data[i].duel.att) + (datt === Generals.data[i].duel.att ? '</strong>' : '') : '?');
		output.push(Generals.data[i].duel ? (ddef === Generals.data[i].duel.def ? '<strong>' : '') + addCommas(Generals.data[i].duel.def) + (ddef === Generals.data[i].duel.def ? '</strong>' : '') : '?');
		output.push(Generals.data[i].monster ? (matt === Generals.data[i].monster.att ? '<strong>' : '') + addCommas(Generals.data[i].monster.att) + (matt === Generals.data[i].monster.att ? '</strong>' : '') : '?');
		output.push(Generals.data[i].monster ? (mdef === Generals.data[i].monster.def ? '<strong>' : '') + addCommas(Generals.data[i].monster.def) + (mdef === Generals.data[i].monster.def ? '</strong>' : '') : '?');
		list.push('<tr><td>' + output.join('</td><td>') + '</td></tr>');
	}
	list.push('</tbody></table>');
	$('a.golem-moveup').live('click', function(event){
		var i, gdown = null, gup = null, x = parseInt($(this).attr('name'), 10);
		Generals._unflush();
		for(i in Generals.data){
			if (Generals.data[i].priority === x){
				gup = i;
			}
			if (Generals.data[i].priority === (x-1)){
				gdown = i;
			}
		}
		if (gdown && gup) {
			debug('Priority: Swapping '+gup+' with '+gdown);
			Generals.data[gdown].priority++;
			Generals.data[gup].priority--;
		}
		Generals.dashboard(sort,rev);
		return false;
	});
	$('a.golem-movedown').live('click', function(event){
		var i, gdown = null, gup = null, x = parseInt($(this).attr('name'), 10);
		Generals._unflush();
		for(i in Generals.data){
			if (Generals.data[i].priority === x){
				gdown = i;
			}
			if (Generals.data[i].priority === (x+1)) {
				gup = i;
			}
		}
		if (gdown && gup) {
			debug('Priority: Swapping '+gup+' with '+gdown);
			Generals.data[gdown].priority++;
			Generals.data[gup].priority--;
		}
		Generals.dashboard(sort,rev);
		return false;
	});
	$('#golem-dashboard-Generals').html(list.join(''));
	$('#golem-dashboard-Generals tbody tr td:nth-child(2)').css('text-align', 'left');
	if (typeof sort !== 'undefined') {
		$('#golem-dashboard-Generals thead th:eq('+sort+')').attr('name',(rev ? 'reverse' : 'sort')).append('&nbsp;' + (rev ? '&uarr;' : '&darr;'));
	}
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Gift() **********
* Auto accept gifts and return if needed
* *** Needs to talk to Alchemy to work out what's being made
*/
var Gift = new Worker('Gift');

Gift.defaults['castle_age'] = {
	pages:'* facebook index army_invite army_gifts gift_accept'
};

Gift.data = {
	received: [],
	todo: {},
	gifts: {}
};

Gift.option = {
	type:'None'
};

Gift.runtime = {
	work:false,
	gift_waiting:false,
	gift_delay:0,
	gift_sent:0,
	sent_id:null,
	gift:{
		sender_id:null,
		sender_ca_name:null,
		sender_fb_name:null,
		name:null,
		id:null
	}
};

Gift.display = [
	{
		label:'Work in progress...'
	},{
		id:'type',
		label:'Return Gifts',
		select:['None', 'Random', 'Same as Received']
	}
];

Gift.init = function() {
	delete this.data.uid;
	delete this.data.lastgift;
	if (length(this.data.gifts)) {
		var i, gift_ids = [], random_gift_id;
		for (i in this.data.gifts) {
			gift_ids.push(i);
		}
		for (i in this.data.todo) {
			if (!(/[^0-9]/g).test(i)) {	// If we have an old entry
				random_gift_id = Math.floor(Math.random() * gift_ids.length);
				if (!this.data.todo[gift_ids[random_gift_id]]) {
					this.data.todo[gift_ids[random_gift_id]] = [];
				}
				this.data.todo[gift_ids[random_gift_id]].push(i);
				delete this.data.todo[i];
			}
		}
	}
};

Gift.parse = function(change) {
	if (change) {
		if (change === 'facebook') {
			debug('Facebook popup parsed...');
		}
		return false;
	}
	var j, gifts = this.data.gifts, todo = this.data.todo, received = this.data.received;
	//alert('Gift.parse running');
	if (Page.page === 'index') {
		// We need to get the image of the gift from the index page.
//		debug('Checking for a waiting gift and getting the id of the gift.');
		if ($('span.result_body').text().indexOf('has sent you a gift') >= 0) {
			this.runtime.gift.sender_ca_name = $('span.result_body').text().regex(/[\t\n]*(.+) has sent you a gift/i);
			this.runtime.gift.name = $('span.result_body').text().regex(/has sent you a gift:\s+(.+)!/i);
			this.runtime.gift.id = $('span.result_body img').attr('src').filepart();
			debug(this.runtime.gift.sender_ca_name + ' has a ' + this.runtime.gift.name + ' waiting for you. (' + this.runtime.gift.id + ')');
			this.runtime.gift_waiting = true;
			return true;
		} else if ($('span.result_body').text().indexOf('warrior wants to join your Army') >= 0) {
			this.runtime.gift.sender_ca_name = 'A Warrior';
			this.runtime.gift.name = 'Random Soldier';
			this.runtime.gift.id = 'random_soldier';
			debug(this.runtime.gift.sender_ca_name + ' has a ' + this.runtime.gift.name + ' waiting for you.');
			this.runtime.gift_waiting = true;
			return true;
		} else {
//			debug('No more waiting gifts. Did we miss the gift accepted page?');
			this.runtime.gift_waiting = false;
			this.runtime.gift = {}; // reset our runtime gift tracker
		}
	} else if (Page.page === 'army_invite') {
		// Accepted gift first
//		debug('Checking for accepted gift.');
		if (this.runtime.gift.sender_id) { // if we have already determined the ID of the sender
			if ($('div.game').text().indexOf('accepted the gift') >= 0 || $('div.game').text().indexOf('have been awarded the gift') >= 0) { // and we have just accepted a gift
				debug('Accepted ' + this.runtime.gift.name + ' from ' + this.runtime.gift.sender_ca_name + '(id:' + this.runtime.gift.sender_id + ')');
				received.push(this.runtime.gift); // add the gift to our list of received gifts.  We will use this to clear facebook notifications and possibly return gifts
				this.runtime.work = true;	// We need to clear our facebook notifications and/or return gifts
				this.runtime.gift = {}; // reset our runtime gift tracker
			}
		}
		// Check for gifts
//		debug('Checking for waiting gifts and getting the id of the sender if we already have the sender\'s name.');
		if ($('div.messages').text().indexOf('gift') >= 0) { // This will trigger if there are gifts waiting
			this.runtime.gift_waiting = true;
			if (!this.runtime.gift.id) { // We haven't gotten the info from the index page yet.
				return false;	// let the work function send us to the index page to get the info.
			}
//			debug('Sender Name: ' + $('div.messages img[title*="' + this.runtime.gift.sender_ca_name + '"]').first().attr('title'));
			this.runtime.gift.sender_id = $('div.messages img[uid]').first().attr('uid'); // get the ID of the gift sender. (The sender listed on the index page should always be the first sender listed on the army page.)
			if (this.runtime.gift.sender_id) {
				this.runtime.gift.sender_fb_name = $('div.messages img[uid]').first().attr('title');
//				debug('Found ' + this.runtime.gift.sender_fb_name + "'s ID. (" + this.runtime.gift.sender_id + ')');
			} else {
				log("Can't find the gift sender's ID.");
			}
		} else {
//			debug('No more waiting gifts. Did we miss the gift accepted page?');
			this.runtime.gift_waiting = false;
			this.runtime.gift = {}; // reset our runtime gift tracker
		}
	
	} else if (Page.page === 'gift_accept'){
		// Check for sent
//		debug('Checking for sent gifts.');
		if (this.runtime.sent_id && $('div#app'+APPID+'_results_main_wrapper').text().indexOf('You have sent') >= 0) {
			debug(gifts[this.runtime.sent_id].name+' sent.');
			for (j=todo[this.runtime.sent_id].length-1; j >= Math.max(todo[this.runtime.sent_id].length - 30, 0); j--) {	// Remove the IDs from the list because we have sent them
				todo[this.runtime.sent_id].pop();
			}
			if (!todo[this.runtime.sent_id].length) {
				delete todo[this.runtime.sent_id];
			}
			this.runtime.sent_id = null;
			if (!todo.length) {
				this.runtime.work = false;
			}
		}
		
	} else if (Page.page === 'army_gifts') { // Parse for the current available gifts
//		debug('Parsing gifts.');
//		debug('Found: '+$('#app'+APPID+'_giftContainer div[id^="app'+APPID+'_gift"]').length);
		this.data.gifts = {};
		gifts = this.data.gifts;
		$('div[id*="_giftContainer"] div[id*="_gift"]').each(function(i,el){
			var id = $('img', el).attr('src').filepart(), name = $(el).text().trim().replace('!',''), slot = $(el).attr('id').regex(/_gift([0-9]+)/);
//			debug('Adding: '+name+'('+id+') to slot '+slot);
			gifts[id] = {};
			gifts[id].name = name;
			gifts[id].slot = slot;
		});
	} else {
		if ($('div.result').text().indexOf('have exceed') !== -1){
			debug('We have run out of gifts to send.  Waiting one hour to retry.');
			this.runtime.gift_delay = Date.now() + 3600000;	// Wait an hour and try to send again.
		}
	}
	return false;
};

Gift.update = function(type, worker) {
	this.runtime.work = length(this.data.todo) > 0 || length(this.data.received) > 0;
};

Gift.work = function(state) {
	if (!this.runtime.gift_waiting && (!this.runtime.work || this.runtime.gift_delay > Date.now())) {
		return QUEUE_FINISH;
	}
	if (!state) {                
		if (this.runtime.gift_waiting || this.runtime.work) {	// We need to get our waiting gift or return gifts.
			return QUEUE_CONTINUE;
		}
		return QUEUE_FINISH;
	}
        if (!Generals.to(Idle.option.general)){
                        return QUEUE_CONTINUE;
                }
	if(this.runtime.gift_waiting && !this.runtime.gift.id) {	// We have a gift waiting, but we don't know the id.
		if (!Page.to('index')) {	// Get the gift id from the index page.
			return QUEUE_CONTINUE;
		}
	}
	if(this.runtime.gift.id && !this.runtime.gift.sender_id) {	// We have a gift id, but no sender id.
		if (!Page.to('army_invite')) {	// Get the sender id from the army_invite page.
			return QUEUE_CONTINUE;
		}
	}
	if (this.runtime.gift.sender_id) { // We have the sender id so we can receive the gift.
		if (!Page.to('army_invite')) {
			return QUEUE_CONTINUE;
		}
//		debug('Accepting ' + this.runtime.gift.name + ' from ' + this.runtime.gift.sender_ca_name + '(id:' + this.runtime.gift.sender_id + ')');
		if (!Page.to('army_invite', {act:'acpt', rqtp:'gift', uid:this.runtime.gift.sender_id}) || this.runtime.gift.sender_id.length > 0) {	// Shortcut to accept gifts without going through Facebook's confirmation page
			return QUEUE_CONTINUE;
		}
	}
	
	var i, j, k, todo = this.data.todo, received = this.data.received, gift_ids = [], random_gift_id, temptype;

	if (!received.length && (!length(todo) || (this.runtime.gift_delay > Date.now()))) {
		this.runtime.work = false;
		Page.to('keep_alchemy');
		return QUEUE_FINISH;
	}
	
	// We have received gifts so we need to figure out what to send back.
	if (received.length) {
		Page.to('army_gifts');
		// Fill out our todo list with gifts to send, or not.
		for (i = received.length - 1; i >= 0; i--){
			temptype = this.option.type;
			if (typeof this.data.gifts[received[i].id] === 'undefined' && this.option.type !== 'None') {
				debug(received[i].id+' was not found in our sendable gift list.');
				temptype = 'Random';
			}
			switch(temptype) {
				case 'Random':
					if (length(this.data.gifts)) {
						gift_ids = [];
						for (j in this.data.gifts) {
							gift_ids.push(j);
						}
						random_gift_id = Math.floor(Math.random() * gift_ids.length);
						debug('Will randomly send a ' + this.data.gifts[gift_ids[random_gift_id]].name + ' to ' + received[i].sender_ca_name);
						if (!todo[gift_ids[random_gift_id]]) {
							todo[gift_ids[random_gift_id]] = [];
						}
						todo[gift_ids[random_gift_id]].push(received[i].sender_id);
					}
					this.runtime.work = true;
					break;
				case 'Same as Received':
					debug('Will return a ' + received[i].name + ' to ' + received[i].sender_ca_name);
					if (!todo[received[i].id]) {
						todo[received[i].id] = [];
					}
					todo[received[i].id].push(received[i].sender_id);
					this.runtime.work = true;
					break;
				case 'None':// deliberate fallthrough
				default:
					this.runtime.work = false;	// Since we aren't returning gifts, we don't need to do any more work.
					break;
			}
			received.pop();
		}
		
		// Clear the facebook notifications and empty the received list.
/*		for (i in received) {
			// Go to the facebook page and click the "ignore" button for this entry
			
			// Then delete the entry from the received list.
			received.shift();
		}*/
		
	}
	
	if (this.runtime.gift_sent > Date.now()) {	// We have sent gift(s) and are waiting for the fb popup
//		debug('Waiting for FB popup.');
		if ($('div.dialog_buttons input[name="sendit"]').length){
			this.runtime.gift_sent = null;
			Page.click('div.dialog_buttons input[name="sendit"]');
		} else if ($('span:contains("Out of requests")').text().indexOf('Out of requests') >= 0) {
			debug('We have run out of gifts to send.  Waiting one hour to retry.');
			this.runtime.gift_delay = Date.now() + 3600000;	// Wait an hour and try to send again.
			Page.click('div.dialog_buttons input[name="ok"]');
		}
		return QUEUE_CONTINUE;
	} else if (this.runtime.gift_sent) {
		this.runtime.gift_sent = null;
	}
	if ($('div.dialog_buttons input[name="skip_ci_btn"]').length) {     // Eventually skip additional requests dialog
		Page.click('div.dialog_buttons input[name="skip_ci_btn"]');
		return QUEUE_CONTINUE;
	}
	
	// Give some gifts back
	if (length(todo) && (!this.runtime.gift_delay || (this.runtime.gift_delay < Date.now()))) {
		for (i in todo) {
//			if (!Page.to('army_gifts')){
			if (typeof this.data.gifts[i] === 'undefined'){	// The gift we want to send has be removed from the game
				for (j in this.data.gifts){
					if (this.data.gifts[j].slot === 1){
						if (typeof todo[j] === 'undefined'){
							todo[j] = todo[i];
						} else {
							todo[j] = todo[j].concat(todo[i]);
						}
						delete todo[i];
						break;
					}
				}
				continue;
			}
			if (!Page.to('army_gifts', {app_friends:'c', giftSelection:this.data.gifts[i].slot}, true)) {	// forcing the page to load to fix issues with gifting getting interrupted while waiting for the popup confirmation dialog box which then causes the script to never find the popup.  Should also speed up gifting.
// Need to deal with the fb requests some other way - possibly an extra parse() option...
//			if (!Page.to('army_gifts', {app_friends:'c', giftSelection:this.data.gifts[i].slot}, false)) {
				return QUEUE_CONTINUE;
			}
			if (typeof this.data.gifts[i] === 'undefined') {  // Unknown gift in todo list
				gift_ids = [];
				for (j in this.data.gifts) {
					gift_ids.push(j);
				}
				random_gift_id = Math.floor(Math.random() * gift_ids.length);
				debug('Unavaliable gift ('+i+') found in todo list. Will randomly send a ' + this.data.gifts[gift_ids[random_gift_id]].name + ' instead.');
				if (!todo[gift_ids[random_gift_id]]) {
					todo[gift_ids[random_gift_id]] = [];
				}
				for (j in todo[i]) {
					todo[gift_ids[random_gift_id]].push(todo[i][j]);
				}
				delete todo[i];
				return QUEUE_CONTINUE;
			}
			if ($('div[style*="giftpage_select"] div a[href*="giftSelection='+this.data.gifts[i].slot+'"]').length){
				if ($('img[src*="gift_invite_castle_on"]').length){
					if ($('div.unselected_list').children().length) {
						debug('Sending out ' + this.data.gifts[i].name);
						k = 0;
						for (j=todo[i].length-1; j>=0; j--) {
							if (k< 30) {	// Need to limit to 30 at a time
								if (!$('div.unselected_list input[value=\'' + todo[i][j] + '\']').length){
//									debug('User '+todo[i][j]+' wasn\'t in the CA friend list.');
									continue;
								}
								Page.click('div.unselected_list input[value="' + todo[i][j] + '"]');
								k++;
							}
						}
						if (k === 0) {
							delete todo[i];
							return QUEUE_CONTINUE;
						}
						this.runtime.sent_id = i;
						this.runtime.gift_sent = Date.now() + (60000);	// wait max 60 seconds for the popup.
						Page.click('input[name="send"]');
						return QUEUE_CONTINUE;
					} else {
						return QUEUE_CONTINUE;
					}
				} else if ($('div.tabBtn img.imgButton[src*="gift_invite_castle_off"]').length) {
					Page.click('div.tabBtn img.imgButton[src*="gift_invite_castle_off"]');
					return QUEUE_CONTINUE;
				} else {
					return QUEUE_CONTINUE;
				}
			} else if ($('div[style*="giftpage_select"]').length) {
				Page.click('a[href*="giftSelection='+this.data.gifts[i].slot+'"]:parent');
				return QUEUE_CONTINUE;
			} else {
				return QUEUE_CONTINUE;
			}
		}
	}
	
	return QUEUE_FINISH;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Heal **********
* Auto-Heal above a stamina level
* *** Needs to check if we have enough money (cash and bank)
*/
var Heal = new Worker('Heal');
Heal.data = null;

Heal.defaults['castle_age'] = {};

Heal.option = {
	stamina: 0,
	health: 0
};

Heal.display = [
	{
		id:'stamina',
		label:'Heal Above',
		after:'stamina',
		select:'stamina'
	},{
		id:'health',
		label:'...And Below',
		after:'health',
		select:'health'
	}
];

Heal.work = function(state) {
	if (Player.get('health') >= Player.get('maxhealth') || Player.get('stamina') < Heal.option.stamina || Player.get('health') >= Heal.option.health) {
		return QUEUE_FINISH;
	}
	if (!state || this.me()) {
		return QUEUE_CONTINUE;
	}
	return QUEUE_RELEASE;
};

Heal.me = function() {
	if (!Page.to('keep_stats')) {
		return true;
	}
	debug('Healing...');
	if ($('input[value="Heal Wounds"]').length) {
		Page.click('input[value="Heal Wounds"]');
	} else {
		log('Danger Danger Will Robinson... Unable to heal!');
	}
	return false;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Idle **********
* Set the idle general
* Keep focus for disabling other workers
*/
var Idle = new Worker('Idle');
Idle.defaults['castle_age'] = {};
Idle.settings ={
    after:['LevelUp']
};

Idle.data = null;
Idle.option = {
	general:'any',
	index:86400000,
	alchemy:86400000,
	quests:0,
	town:0,
	arena:0,
	battle:900000,
	monsters:3600000,
	collect:0
};

//Idle.when = ['Never', 'Quarterly', 'Hourly', '2 Hours', '6 Hours', '12 Hours', 'Daily', 'Weekly'];
Idle.when = {
	0:'Never',
	900000:'Quarterly',
	3600000:'Hourly',
	7200000:'2 Hours',
	21600000:'6 Hours',
	43200000:'12 Hours',
	86400000:'Daily',
	604800000:'Weekly'
};

Idle.display = [
	{
		label:'<strong>NOTE:</strong> Any workers below this will <strong>not</strong> run!<br>Use this for disabling workers you do not use.'
	},{
		id:'general',
		label:'Idle General',
		select:'generals'
	},{
		label:'Check Pages:'
	},{
		id:'index',
		label:'Home Page',
		select:Idle.when
	},{
		id:'alchemy',
		label:'Alchemy',
		select:Idle.when
	},{
		id:'quests',
		label:'Quests',
		select:Idle.when
	},{
		id:'town',
		label:'Town',
		select:Idle.when
	},{
		id:'arena',
		label:'Arena',
		select:Idle.when
	},{
		id:'battle',
		label:'Battle',
		select:Idle.when
	},{
		id:'monsters',
		label:'Monsters',
		select:Idle.when
	},{
		id:'collect',
		label:'Apprentice Reward',
		select:Idle.when
	}
];

Idle.pages = {
	index:['index'],
	alchemy:['keep_alchemy'],
	quests:['quests_quest1', 'quests_quest2', 'quests_quest3', 'quests_quest4', 'quests_quest5', 'quests_quest6', 'quests_quest7', 'quests_quest8', 'quests_quest9', 'quests_demiquests', 'quests_atlantis'],
	town:['town_soldiers', 'town_blacksmith', 'town_magic', 'town_land'],
	arena:['battle_arena'],
	battle:['battle_battle'],
	monsters:['monster_monster_list', 'battle_raid'],
	collect:['apprentice_collect']
};

Idle.work = function(state) {
	if (!state) {
		return true;
	}
	var i, p, time, now = Date.now();
	if (!Generals.to(this.option.general)) {
		return true;
	}
	for (i in this.pages) {
		if (!this.option[i]) {
			continue;
		}
		time = now - this.option[i];
		for (p=0; p<this.pages[i].length; p++) {
			if (!Page.get(this.pages[i][p]) || Page.get(this.pages[i][p]) < time) {
				if (!Page.to(this.pages[i][p])) {
					Page.set(this.pages[i][p], now);
					return true;
				}
			}
		}
	}
	return true;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Bank, Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Income **********
* Auto-general for Income, also optional bank
* User selectable safety margin - at default 5 sec trigger it can take up to 14 seconds (+ netlag) to change
*/
var Income = new Worker('Income');
Income.data = null;

Income.settings = {
	important:true
};

Income.defaults['castle_age'] = {};

Income.option = {
	general:true,
	bank:true,
	margin:45
};

Income.display = [
	{
		id:'general',
		label:'Use Best General',
		checkbox:true
	},{
		id:'bank',
		label:'Automatically Bank',
		checkbox:true
	},{
		advanced:true,
		id:'margin',
		label:'Safety Margin',
		select:[15,30,45,60],
		suffix:'seconds'
	}
];

Income.work = function(state) {
	if (!Income.option.margin || !this.option.general) {
		return QUEUE_FINISH;
	}
//	debug(when + ', Margin: ' + Income.option.margin);
	if (Player.get('cash_timer') > this.option.margin) {
		if (state && this.option.bank) {
			return Bank.work(true);
		}
		return QUEUE_FINISH;
	}
	if (!state || !Generals.to('income')) {
		return QUEUE_CONTINUE;
	}
	debug('Waiting for Income... (' + Player.get('cash_timer') + ' seconds)');
	return QUEUE_CONTINUE;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Bank, Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Land **********
* Auto-buys property
*/
var Land = new Worker('Land');

Land.defaults['castle_age'] = {
	pages:'town_land'
};

Land.option = {
	enabled:true,
//	wait:48,
	onlyten:false,
	sell:false,
	land_exp:false,
	style:0
};

Land.runtime = {
	lastlevel:0,
	best:null,
	buy:0,
	cost:0
};

Land.display = [
	{
		id:'enabled',
		label:'Auto-Buy Land',
		checkbox:true
	},{
		advanced:true,
		id:'sell',
		label:'Sell Extra Land',
		checkbox:true,
		help:'You can sell land above your Max at full price.'
	},{
		exploit:true,
		id:'land_exp',
		label:'Sell Extra Land 10 at a time',
		checkbox:true,
		help:'If you have extra lands, this will sell 10x.  The extra sold lands will be repurchased at a lower cost.'
	},{
		id:'style',
		label:'ROI Style',
		select:{0:'Percent', 1:'Daily'},
		help:'This changes the display when visiting the LanD page.'
	}
/*
	},{
		id:'wait',
		label:'Maximum Wait Time',
		select:[0, 24, 36, 48],
		suffix:'hours',
		help:'There has been a lot of testing in this code, it is the fastest way to increase your income despite appearances!'
	},{
		advanced:true,
		id:'onlyten',
		label:'Only buy 10x<br>NOTE: This is slower!!!',
		checkbox:true,
		help:'The standard method is guaranteed to be the most efficient.  Choosing this option will slow down your income.'
	}
*/
];

Land.init = function(){
    this._watch(Bank);
	Resources.use('Gold');
};

Land.parse = function(change) {
	$('tr.land_buy_row,tr.land_buy_row_unique').each(function(i,el){
		var name = $('img', el).attr('alt'), tmp;
		if (!change) {
			// Fix for broken land page!!
			if (!$('.land_buy_image_int', el).length) {
				$('.land_buy_image', el).prepend('<div class="land_buy_image_int"></div>').children('.land_buy_image_int').append($('.land_buy_image >[class!="land_buy_image_int"]', el));
			}
			if (!$('.land_buy_info_int', el).length) {
				$('.land_buy_info, .land_buy_info2', el).prepend('<div class="land_buy_info_int"></div>').children('.land_buy_info_int').append($('.land_buy_info >[class!="land_buy_info_int"], .land_buy_info2 >[class!="land_buy_info_int"]', el));
			}
			Land.data[name] = {};
			Land.data[name].income = $('.land_buy_info .gold, .land_buy_info2 .gold', el).text().replace(/[^0-9]/g,'').regex(/([0-9]+)/);
			Land.data[name].max = $('.land_buy_info, .land_buy_info2', el).text().regex(/Max Allowed For your level: ([0-9]+)/i);
			Land.data[name].cost = $('.land_buy_costs .gold', el).text().replace(/[^0-9]/g,'').regex(/([0-9]+)/);
			tmp = $('option', $('.land_buy_costs .gold', el).parent().next()).last().attr('value');
			if (tmp) {
				Land.data[name].buy = tmp;
			}
			Land.data[name].own = $('.land_buy_costs span', el).text().replace(/[^0-9]/g,'').regex(/([0-9]+)/);
		} else {
			$('.land_buy_info strong:first, .land_buy_info2 strong:first', el).after(' (<span title="Return On Investment - higher is better"><strong>ROI</strong>: ' + ((Land.data[name].income * 100 * (Land.option.style ? 24 : 1)) / Land.data[name].cost).round(3) + '%' + (Land.option.style ? ' / Day' : '') + '</span>)');
		}
	});
	return true;
};

Land.update = function() {
	var i, worth = Bank.worth(), income = Player.get('income') + History.get('income.mean'), best, buy = 0, cost_increase,time_limit;
	
	if (this.option.land_exp) {
		$('input:golem(land,sell)').attr('checked',true);
		this.option.sell = true;
	}
	
	for (i in this.data) {
		if (this.option.sell && this.data[i].max > 0 && this.data[i].own > this.data[i].max) {
			best = i;
			buy = this.data[i].max - this.data[i].own;// Negative number means sell
			if (this.option.land_exp) {
				buy = -10;
			}
			break;
		}
		if (this.data[i].buy) {
			if (!best || ((this.data[best].cost / income) + (this.data[i].cost / (income + this.data[best].income))) > ((this.data[i].cost / income) + (this.data[best].cost / (income + this.data[i].income)))) {
				best = i;
			}
		}
	}
	if (best) {
		if (!buy) {
	/*		if (this.option.onlyten || (this.data[best].cost * 10) <= worth || (this.data[best].cost * 10 / income < this.option.wait)) {
				buy = Math.min(this.data[best].max - this.data[best].own, 10);
			} else if ((this.data[best].cost * 5) <= worth || (this.data[best].cost * 5 / income < this.option.wait)) {
				buy = Math.min(this.data[best].max - this.data[best].own, 5);
			} else {
				buy = 1;
			}*/
			
			//	This calculates the perfect time to switch the amounts to buy.
			//	If the added income from a smaller purchase will pay for the increase in price before you can afford to buy again, buy small.
			//	In other words, make the smallest purchase where the time to make the purchase is larger than the time to payoff the increased cost with the extra income.
			//	It's different for each land because each land has a different "time to payoff the increased cost".
			
			cost_increase = this.data[best].cost / (10 + this.data[best].own);		// Increased cost per purchased land.  (Calculated from the current price and the quantity owned, knowing that the price increases by 10% of the original price per purchase.)
			time_limit = cost_increase / this.data[best].income;		// How long it will take to payoff the increased cost with only the extra income from the purchase.  (This is constant per property no matter how many are owned.)
			time_limit = time_limit * 1.5;		// fudge factor to take into account that most of the time we won't be buying the same property twice in a row, so we will have a bit more time to recoup the extra costs.
//			if (this.option.onlyten || (this.data[best].cost * 10) <= worth) {			// If we can afford 10, buy 10.  (Or if people want to only buy 10.)
			if ((this.data[best].cost * 10) <= worth) {			// If we can afford 10, buy 10.
				buy = Math.min(this.data[best].max - this.data[best].own, 10);
			} else if (this.data[best].cost / income > time_limit){		// If it will take longer to save for 1 land than it will take to payoff the increased cost, buy 1.
				buy = 1;
			} else if (this.data[best].cost * 5 / income > time_limit){	// If it will take longer to save for 5 lands than it will take to payoff the increased cost, buy 5.
				buy = Math.min(this.data[best].max - this.data[best].own, 5);
			} else {																	// Otherwise buy 10 because that's the max.
				buy = Math.min(this.data[best].max - this.data[best].own, 10);
			}
		}
		this.runtime.buy = buy;
		this.runtime.cost = buy * this.data[best].cost; // May be negative if we're making money by selling
		Dashboard.status(this, (buy>0 ? (this.runtime.buy ? 'Buying ' : 'Want to buy ') : (this.runtime.buy ? 'Selling ' : 'Want to sell ')) + Math.abs(buy) + 'x ' + best + ' for $' + shortNumber(Math.abs(this.runtime.cost)) + ' (Available Cash: $' + shortNumber(Bank.worth()) + ')');
	} else {
		Dashboard.status(this);
	}
	this.runtime.best = best;
};

Land.work = function(state) {
	if (!this.option.enabled || !this.runtime.best || !this.runtime.buy || !Bank.worth(this.runtime.cost)) {
		if (!this.runtime.best && this.runtime.lastlevel < Player.get('level')) {
			if (!state || !Page.to('town_land')) {
				return QUEUE_CONTINUE;
			}
			this.runtime.lastlevel = Player.get('level');
		}
                if (this.runtime.best && typeof this.runtime.best !== 'undefined'){
                    Dashboard.status(this, (this.runtime.buy>0 ? (this.runtime.buy ? 'Buying ' : 'Want to buy ') : (this.runtime.buy ? 'Selling ' : 'Want to sell ')) + Math.abs(this.runtime.buy) + 'x ' + this.runtime.best + ' for $' + shortNumber(Math.abs(this.runtime.cost)) + ' (Available Cash: $' + shortNumber(Bank.worth()) + ')');
                } else {
                    Dashboard.status(this);
                }
		return QUEUE_FINISH;
	}
	if (!state || !Bank.retrieve(this.runtime.cost) || !Page.to('town_land')) {
                return QUEUE_CONTINUE;
	}
//	var el = $('tr.land_buy_row:contains("'+this.runtime.best+'"),tr.land_buy_row_unique:contains("'+this.runtime.best+'")');
	$('tr.land_buy_row,tr.land_buy_row_unique').each(function(i,el){
		if ($('img', el).attr('alt') === Land.runtime.best) {
			if (Land.runtime.buy > 0) {
				$('select', $('.land_buy_costs .gold', el).parent().next()).val(Land.runtime.buy > 5 ? 10 : (Land.runtime.buy > 1 ? 5 : 1));
			} else {
				$('select', $('.land_buy_costs .gold', el).parent().parent().next()).val(Land.runtime.buy <= -10 ? 10 : (Land.runtime.buy <= -5 ? 5 : 1));
			}
			debug((Land.runtime.buy > 0 ? 'Buy' : 'Sell') + 'ing ' + Math.abs(Land.runtime.buy) + ' x ' + Land.runtime.best + ' for $' + shortNumber(Math.abs(Land.runtime.cost)));
			Page.click($('.land_buy_costs input[name="' + (Land.runtime.buy > 0 ? 'Buy' : 'Sell') + '"]', el));
		}
	});
	return QUEUE_RELEASE;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Bank, Battle, Generals, Heal, Income, LevelUp:true, Monster, Player, Quest,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.LevelUp **********
* Will give us a quicker level-up, optionally changing the general to gain extra stats
* 1. Switches generals to specified general
* 2. Changes the best Quest to the one that will get the most exp (rinse and repeat until no energy left) - and set Queue.burn.energy to max available
* 3. Will call Heal.me() function if current health is under 10 and there is any stamina available (So Battle/Arena/Monster can automatically use up the stamina.)
* 4. Will set Queue.burn.stamina to max available
*/

var LevelUp = new Worker('LevelUp');
LevelUp.data = null;

LevelUp.settings = {
	before:['Idle','Battle','Monster','Quest']
};

LevelUp.defaults['castle_age'] = {
	pages:'*'
};

LevelUp.option = {
	enabled:false,
	income:true,
	bank:true,
	general:'any',
	order:'stamina',
	algorithm:'Per Action'
};

LevelUp.runtime = {
	level:0,// set when we start, compare to end
	heal_me:false,// we're active and want healing...
	battle_monster:false,// remember whether we're doing monsters first or not or not...
	old_quest:null,// save old quest, if it's not null and we're working then push it back again...
	old_quest_energy:0,
	running:false,// set when we change
	energy:0,
	stamina:0,
	exp:0,
	exp_possible:0,
	avg_exp_per_energy:1.4,
	avg_exp_per_stamina:2.4,
	defending:false, // True if last exp from energy was from a quest
	quests:[] // quests[energy] = [experience, [quest1, quest2, quest3]]
};

LevelUp.display = [
	{
		title:'Important!',
		label:'This will spend Energy and Stamina to force you to level up quicker.'
	},{
		id:'enabled',
		label:'Enabled',
		checkbox:true
	},{
		id:'income',
		label:'Allow Income General',
		checkbox:true
	},{
		id:'bank',
		label:'Allow Bank General',
		checkbox:true
	},{
		id:'general',
		label:'Best General',
		select:['any', 'Energy', 'Stamina'],
		help:'Select which type of general to use when leveling up.'
	},{
		id:'order',
		label:'Spend first ',
		select:['Energy','Stamina'],
		help:'Select which resource you want to spend first when leveling up.'
	},{
		id:'algorithm',
		label:'Estimation Method',
		select:['Per Action', 'Per Hour', 'Manual'],
		help:"'Per Hour' uses your gain per hour. 'Per Action' uses your gain per action."
	},{
		id:'manual_exp_per_stamina',
		label:'Exp per stamina',
		require:{'algorithm':'Manual'},
		text:true,
		help:'Experience per stamina point.  Defaults to Per Action if 0 or blank.'
	},{
		id:'manual_exp_per_energy',
		label:'Exp per energy',
		require:{'algorithm':'Manual'},
		text:true,
		help:'Experience per energy point.  Defaults to Per Action if 0 or blank.'
	}
];

LevelUp.init = function() {
	this._watch(Player);
	this._watch(Quest);
	this.runtime.exp = this.runtime.exp || Player.get('exp'); // Make sure we have a default...
	this.runtime.level = this.runtime.level || Player.get('level'); // Make sure we have a default...
};

LevelUp.parse = function(change) {
	var exp, runtime = this.runtime;
	if (change) {

//		$('#app'+APPID+'_st_2_5 strong').attr('title', Player.get('exp') + '/' + Player.get('maxexp') + ' at ' + addCommas(this.get('exp_average').round(1)) + ' per hour').html(addCommas(Player.get('exp_needed')) + '<span style="font-weight:normal;"><span style="color:rgb(25,123,48);" name="' + this.get('level_timer') + '"> ' + this.get('time') + '</span></span>');
		$('#app'+APPID+'_st_2_5 strong').html('<span title="' + Player.get('exp') + '/' + Player.get('maxexp') + ' at ' + addCommas(this.get('exp_average').round(1)) + ' per hour">' + addCommas(Player.get('exp_needed')) + '</span> <span style="font-weight:normal;color:rgb(25,123,48);" title="' + this.get('timer') + '">' + this.get('time') + '</span>');
	} else {
		$('.result_body').each(function(i,el){
			if (!$('img[src$="battle_victory.gif"]', el).length) {
				return;
			}
			var txt = $(el).text().replace(/,|\t/g, ''), x;
			x = txt.regex(/([+-][0-9]+) Experience/i);
			if (x) { History.add('exp+battle', x); }
			x = (txt.regex(/\+\$([0-9]+)/i) || 0) - (txt.regex(/\-\$([0-9]+)/i) || 0);
			if (x) { History.add('income+battle', x); }
			x = txt.regex(/([+-][0-9]+) Battle Points/i);
			if (x) { History.add('bp+battle', x); }
			x = txt.regex(/([+-][0-9]+) Stamina/i);
			if (x) { History.add('stamina+battle', x); }
			x = txt.regex(/([+-][0-9]+) Energy/i);
			if (x) { History.add('energy+battle', x); }
		});
	}
	return true;
};

LevelUp.update = function(type,worker) {
	var d, i, j, k, record, quests, energy = Player.get('energy'), stamina = Player.get('stamina'), exp = Player.get('exp'), runtime = this.runtime,order = Config.getOrder(), stamina_samples;
	if (worker === Player || !length(runtime.quests)) {
		if (exp > runtime.exp && $('span.result_body:contains("xperience")').length) {
			// Experience has increased...
			if (runtime.stamina > stamina) {
				calc_rolling_weighted_average(runtime, 'exp',exp - runtime.exp,
						'stamina',runtime.stamina - stamina);
			} else if (runtime.energy > energy) {
				this.runtime.defending = (Page.page === 'monster_battle_monster');
				// Only need average for monster defense.  Quest average is known.
				if (this.runtime.defending) {
					calc_rolling_weighted_average(runtime, 'exp',exp - runtime.exp,
						'energy',runtime.energy - energy);
				}
			}
		}
		runtime.energy = energy;
		runtime.stamina = stamina;
		runtime.exp = exp;
	}
// Unnecessary to calculate fastest level up time.  Historical is more accurate, and if the user wanted to level up as fast as possible, they would set Quest for Experience.
/*
	if (worker === Quest || !length(runtime.quests)) { // Now work out the quickest quests to level up
		quests = Quest.get();
		runtime.quests = quests = [[0]];// quests[energy] = [experience, [quest1, quest2, quest3]]
		for (i in quests) { // Fill out with the best exp for every energy cost
			if (!quests[quests[i].energy] || quests[i].exp > quests[quests[i].energy][0]) {
				quests[quests[i].energy] = [quests[i].exp, [i]];
			}
		}
		j = 1;
		k = [0];
		for (i=1; i<quests.length; i++) { // Fill in the blanks and replace using the highest exp per energy ratios
			if (quests[i] && quests[i][0] / i >= k[0] / j) {
				j = i;
				k = quests[i];
			} else {
				quests[i] = [k[0], [k[1][0]]];
			}
		}
		while (quests.length > 1 && quests[quests.length-1][0] === quests[quests.length-2][0]) { // Delete entries at the end that match (no need to go beyond our best ratio quest)
			quests.pop();
		}
// No need to merge quests as we're only interested in the first one...
//		for (i=1; i<quests.length; i++) { // Merge lower value quests to use up all the energy
//			if (quests[quests[i][1][0]].energy < i) {
//				quests[i][0] += quests[i - quests[quests[i][1][0]].energy][0];
//				quests[i][1] = quests[i][1].concat(quests[i - quests[quests[i][1][0]].energy][1])
//			}
//		}
//		debug('Quickest '+quests.length+' Quests: '+JSON.stringify(quests));
	}
	if (this.runtime.quests.length <= 1) { // No known quests yet...
		runtime.exp_possible = 1;
	} else if (energy < this.runtime.quests.length) { // Energy from questing
		runtime.exp_possible = this.runtime.quests[Math.min(energy, this.runtime.quests.length - 1)][0];
	} else {
		runtime.exp_possible = (this.runtime.quests[this.runtime.quests.length-1][0] * Math.floor(energy / (this.runtime.quests.length - 1))) + this.runtime.quests[energy % (this.runtime.quests.length - 1)][0];
	}
		if ((order.indexOf('Idle') >= order.indexOf('Monster') && (Monster.runtime.attack)) || (order.indexOf('Idle') >= order.indexOf('Battle'))){
			runtime.exp_possible += Math.floor(stamina * runtime.avg_exp_per_stamina); // Stamina estimate (when we can spend it)
		}
*/
	d = new Date(this.get('level_time'));
	if (this.option.enabled) {
		if (runtime.running) {
			Dashboard.status(this, '<span title="Exp Possible: ' + this.get('exp_possible') + ', per Hour: ' + addCommas(this.get('exp_average').round(1)) + ', per Energy: ' + this.get('exp_per_energy').round(2) + ', per Stamina: ' + this.get('exp_per_stamina').round(2) + '">LevelUp Running Now!</span>');
		} else {
			Dashboard.status(this, '<span title="Exp Possible: ' + this.get('exp_possible') + ', per Energy: ' + this.get('exp_per_energy').round(2) + ', per Stamina: ' + this.get('exp_per_stamina').round(2) + '">' + this.get('time') + ' after <span class="golem-timer">' + this.get('timer')+ '</span> (at ' + addCommas(this.get('exp_average').round(1)) + ' exp per hour)</span>');
		}
	} else {
		Dashboard.status(this);
	}
	if (!this.option.enabled || this.option.general === 'any') {
		Generals.set('runtime.disabled', false);
	}
};

LevelUp.work = function(state) {
	var runtime = this.runtime, energy = Player.get('energy'), stamina = Player.get('stamina'), order = Config.getOrder();
	//debug('runtime ' + runtime.level + ' player ' + Player.get('level'));
	// Get our level up general if we're less than 100 exp from level up
	if (this.option.general !== 'any' && Player.get('exp_needed') < 100 && !(this.option.bank && Queue.get('runtime.current') === 'Bank') && !(this.option.income && Queue.get('runtime.current') === 'Income')) {
		Generals.set('runtime.disabled', false);
		if (Generals.to(this.option.general)) {
			//debug('Disabling Generals because we are within 100 XP from leveling.');
			Generals.set('runtime.disabled', true);	// Lock the General again so we can level up.
		} else {
			return QUEUE_CONTINUE;	// Try to change generals again
		}
	} else {
		Generals.set('runtime.disabled', false);
	}
	if (runtime.old_quest) {
		Quest.runtime.best = runtime.old_quest;
		Quest.runtime.energy = runtime.old_quest_energy;
		runtime.old_quest = null;
		runtime.old_quest_energy = 0;
	}
	if (!this.option.enabled || this.get('exp_possible') < Player.get('exp_needed')) {
		if (runtime.running) { // Shut down the level up burn
			if (runtime.level < Player.get('level')) { // We've just levelled up
				if ($('#app'+APPID+'_energy_current_value').next().css('color') === 'rgb(25, 123, 48)' && energy >= Player.get('maxenergy')) {
					Queue.burn.energy = energy;
					Queue.burn.stamina = 0;
					return QUEUE_FINISH;
				}
				if ($('#app'+APPID+'_stamina_current_value').next().css('color') === 'rgb(25, 123, 48)' && stamina >= Player.get('maxstamina')) {
					Queue.burn.energy = 0;
					Queue.burn.stamina = stamina;
					return QUEUE_FINISH;
				}
			}
			Generals.set('runtime.disabled', false);
			Queue.burn.stamina = Math.max(0, stamina - Queue.get('option.stamina'));
			Queue.burn.energy = Math.max(0, energy - Queue.get('option.energy'));
			Battle.set('option.monster', runtime.battle_monster);
			runtime.running = false;
			runtime.level = Player.get('level');
		}
		return QUEUE_FINISH;
	}
	if (state && runtime.heal_me) {
		if (Heal.me()) {
			return QUEUE_CONTINUE;
		}
		runtime.heal_me = false;
	}
	if (state && !runtime.running) { // We're not running yet and we have focus
		runtime.level = Player.get('level');
		runtime.battle_monster = Battle.get('option.monster');
		runtime.running = true;
		//debug('Running '+runtime.running);
		Battle.set('option.monster', false);
	}

		
/*	max quest xp = quests < energy max exp * number possible
	max fortification 
	max stamina
	
	Find biggest chunk
	Do normal action until can't fit any more
	Do tiny chunks to fill up space
	Do biggest chunk
*/	
	if (runtime.level === Player.get('level') && Player.get('health') < 13 && stamina) { // If we're still trying to level up and we don't have enough health and we have stamina to burn then heal us up...
		runtime.heal_me = true;
		return QUEUE_CONTINUE;
	}

	// We don't have focus, but we do want to level up quicker
	if (this.option.order !== 'Stamina' 
			|| !stamina || Player.get('health') < 13 
			|| (stamina < Monster.runtime.stamina 
				&& (!Battle.runtime.attacking 
					|| (order.indexOf('Idle') <= order.indexOf('Battle'))))
			|| ((order.indexOf('Idle') <= order.indexOf('Monster')
					|| (!Monster.runtime.attack))
			&& (!Battle.runtime.attacking 
				|| (order.indexOf('Idle') <= order.indexOf('Battle'))))){
		debug('Running Energy Burn');
		if (Player.get('energy')) { // Only way to burn energy is to do quests - energy first as it won't cost us anything
	
			var big_quest = null, normal_quest = null, little_quest = null;
			quests = Quest.get();
			big_quest = bestObjValue(quests, function(q){
				return ((q.energy <= energy && q.energy > quests[Quest.runtime.best].energy) 
						? q.exp : null);
			});
//	debug('big_quest = ' + big_quest);
			var big_quest_energy = 0;
			if (big_quest){
				big_quest_energy = quests[big_quest].energy;
			}
//	debug('big_quest_energy = ' + big_quest_energy);

/*	// Find the biggest monster to throw exp into the next level
			monsters = Monster.get();
			for (i in monsters) { 
				stamina_options.concatenate(Monsters.types[monsters[i].type_label].attack);
			}
			
			big_attack = bestObjValue(stamina_options, function(s){
				return ((s =< stamina && s > this.runtime.record.exp_per_stamina.stamina[0]) ? s : null);
			}); 
			
*/	// See if we can do some of our normal quests before the big one
			var exp = Player.get('exp_needed');
			if (energy - big_quest_energy > quests[Quest.runtime.best].energy
					&& exp > quests[Quest.runtime.best].exp) {
				debug('Doing normal quest to burn energy');
				normal_quest = Quest.runtime.best;
			}
			// Find out if we have room to do some small quests before we get to the big one
			for (i in quests) { 
				if (energy - big_quest_energy >= quests[i].energy
						&& exp > quests[i].exp
						&& (!little_quest || (quests[i].energy / quests[i].exp) < (quests[little_quest].energy / quests[little_quest].exp))) {
					little_quest = i;
				}
			}
			var next_quest = normal_quest || little_quest || big_quest;
			if (next_quest) {
				debug('Doing a small quest to burn energy');
				Queue.burn.energy = energy;
				Queue.burn.stamina = 0;
				runtime.old_quest_energy = Quest.runtime.energy;
				runtime.old_quest = Quest.runtime.best;
				Quest.runtime.energy = energy; // Ok, we're lying, but it works...
				Quest.runtime.best = next_quest; // Access directly as Quest.set() would force a Quest.update and overwrite this again
				return QUEUE_FINISH;
			}
		}
	} else {
		debug('Running Stamina Burn');
	}
	Quest._update('data', null); // Force Quest to decide it's best quest again...
	// Got to have stamina left to get here, so burn it all
	Queue.burn.energy = 0; // Will be 0 anyway, but better safe than sorry
	Queue.burn.stamina = stamina; // Make sure we can burn everything, even the stuff we're saving
	return QUEUE_FINISH;
};

LevelUp.get = function(what,def) {
	switch(what) {
	case 'timer':		return makeTimer(this.get('level_timer'));
	case 'time':		return (new Date(this.get('level_time'))).format('D g:i a');
	case 'level_timer':	return Math.floor((this.get('level_time') - Date.now()) / 1000);
	case 'level_time':	return Date.now() + Math.floor(3600000 * ((Player.get('exp_needed') - this.get('exp_possible')) / (this.get('exp_average') || 10)));
	case 'exp_average':
		if (this.option.algorithm === 'Per Hour') {
			return History.get('exp.average.change');
		}
		return (12 * (this.get('exp_per_stamina') + this.get('exp_per_energy')));
	case 'exp_possible':	
		return (Player.get('stamina')*this.get('exp_per_stamina') 
				+ Player.get('energy') * this.get('exp_per_energy')).round(0);
	case 'exp_per_stamina':	
		if (this.option.algorithm === 'Manual' && this.option.manual_exp_per_stamina) {
			return this.option.manual_exp_per_stamina;
		}
		return this.runtime.avg_exp_per_stamina;
	case 'exp_per_energy':	
		if (this.option.algorithm === 'Manual' && this.option.manual_exp_per_energy) {
			return this.option.manual_exp_per_energy;
		}
		return ((this.runtime.defending || !Quest.get('runtime.best',false))
				? this.runtime.avg_exp_per_energy
				: Quest.get('data.'+Quest.get('runtime.best') + '.exp') / 
					Quest.get('data.'+Quest.get('runtime.best') + '.energy'));
	default: return this._get(what,def);
	}
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Monster **********
 * Automates Monster
 */
var Monster = new Worker('Monster');
Monster.data = {};

Monster.defaults['castle_age'] = {
	pages:'monster_monster_list keep_monster_active monster_battle_monster battle_raid'
};

Monster.option = {
	general:true,
	general_defend:'any',
	general_attack:'any',
	general_raid:'any',
	defend: 30,
	//	quest_over: 90,
	min_to_attack: -30,
	defend_active:false,
	choice: 'Any',
	stop: 'Never',
	own: true,
	hide:false,
	armyratio: 'Any',
	levelratio: 'Any',
	force1: true,
	raid: 'Invade x5',
	assist: true,
	attack_max: 5,
	attack_min: 5,
	defend_max: 10,
	defend_min: 10,
//	monster_check:'Hourly',
	check_interval:3600000,
	avoid_lost_cause:false,
	lost_cause_hours:5,
	rescue:false,
	risk:false,
        points:false
};

Monster.runtime = {
	check:false, // id of monster to check if needed, otherwise false
	attack:false, // id of monster if we have an attack target, otherwise false
	defend:false, // id of monster if we have a defend target, otherwise false
	secondary: false, // Is there a target for mage or rogue that is full or not in cycle?  Used to tell quest to wait if don't quest when fortifying is on.
	avg_damage_per_stamina:1,
	avg_defend_per_energy:1,
	stamina_used:0,
	energy_used:0,
	health:10 // minimum health to attack
};

Monster.display = [
	{
		title:'Attack'
	},{
		id:'best_attack',
		label:'Use Best General',
		checkbox:true
	},{
		advanced:true,
		id:'general_attack',
		label:'Attack General',
		require:{'best_attack':false},
		select:'generals'
	},{
		advanced:true,
		id:'hide',
		label:'Use Raids and Monsters to Hide',
		checkbox:true,
		require:{'stop':['Never', 'Achievement', '2X Achievement']},
		help:'Fighting Raids keeps your health down. Fight Monsters with remaining stamina.'
	},{
                advanced:true,
                id:'points',
                label:'Get Demi Points First',
                checkbox:true,
                help:'Use Battle to get Demi Points prior to attacking Monsters.'
        },{
		id:'min_to_attack',
		label:'Attack Over',
		text:1,
		help:'Attack if defense is over this value. Range of 0% to 100%.',
		after:'%'
	},{
		id:'choice',
		label:'Attack',
		select:['Any', 'Strongest', 'Weakest', 'Shortest ETD', 'Longest ETD', 'Spread', 'Max Damage', 'Min Damage','ETD Maintain']
	},{
		id:'stop',
		label:'Stop',
		select:['Never', 'Achievement', '2X Achievement', 'Priority List'],
		help:'Select when to stop attacking a target.'
	},{
		id:'priority',
		label:'Priority List',
		require:{'stop':'Priority List'},
		textarea:true,
		help:'Prioritized list of which monsters to attack'
	},{
		advanced:true,
		id:'own',
		label:'Never stop on Your Monsters',
		require:{'stop':['Never', 'Achievement', '2X Achievement']},
		checkbox:true,
		help:'Never stop attacking your own summoned monsters (Ignores Stop option).'
	},{
		advanced:true,
		id:'rescue',
		require:{'stop':['Never', 'Achievement', '2X Achievement']},
		label:'Rescue failing monsters',
		checkbox:true,
		help:'Attempts to rescue failing monsters even if damage is at or above Stop Optionby continuing to attack. Can be used in coordination with Lost-cause monsters setting to give up if monster is too far gone to be rescued.'
	},{
		advanced:true,
		id:'avoid_lost_cause',
		label:'Avoid Lost-cause Monsters',
		require:{'stop':['Never', 'Achievement', '2X Achievement']},
		checkbox:true,
		help:'Do not attack monsters that are a lost cause, i.e. the ETD is longer than the time remaining.'
	},{
		advanced:true,
		id:'lost_cause_hours',
		label:'Lost-cause if ETD is',
		require:'avoid_lost_cause',
		after:'hours after timer',
		text:true,
		help:'# of Hours Monster must be behind before preventing attacks.'
	},{
		id:'attack_min',
		label:'Min Stamina Cost',
		select:[1,5,10,20,50],
		help:'Select the minimum stamina for a single attack'
	},{
		id:'attack_max',
		label:'Max Stamina Cost',
		select:[1,5,10,20,50],
		help:'Select the maximum stamina for a single attack'
	},{
		title:'Defend'
	},{
		id:'defend_active',
		label:'Defend Active',
		checkbox:true,
		help:'Must be checked to defend.'
	},{
//		id:'defend_group',
		require:'defend_active',
		group:[
			{
				id:'best_defend',
				label:'Use Best General',
				checkbox:true
			},{
				advanced:true,
				id:'general_defend',
				require:{'best_defend':false},
				label:'Defend General',
				select:'generals'
			},{
				id:'defend',
				label:'Defend Below',
				text:30,
				help:'Defend if defense is under this value. Range of 0% to 100%.',
				after:'%'
			},{
				id:'defend_min',
				label:'Min Energy Cost',
				select:[10,20,40,100],
				help:'Select the minimum energy for a single energy action'
			},{
				id:'defend_max',
				label:'Max Energy Cost',
				select:[10,20,40,100],
				help:'Select the maximum energy for a single energy action'
			}
		]
	},{
		title:'Raids'
	},{
		id:'best_raid',
		label:'Use Best General',
		checkbox:true
	},{
		advanced:true,
		id:'general_raid',
		label:'Raid General',
		require:{'best_raid':false},
		select:'generals'
	},{
		id:'raid',
		label:'Raid',
		select:['Invade', 'Invade x5', 'Duel', 'Duel x5']
	},{
		advanced:true,
		id:'risk',
		label:'Risk Death',
		checkbox:true,
		help:'The lowest health you can raid with is 10, but you can lose up to 12 health in a raid, so are you going to risk it???'
	},{
		id:'armyratio',
		require:{'raid':[['Duel', 'Duel x5']]},
		label:'Target Army Ratio',
		select:['Any', 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
		help:'Smaller number for smaller target army. Reduce this number if you\'re losing in Invade'
	},{
		id:'levelratio',
		require:{'raid':[['Invade', 'Invade x5']]},
		label:'Target Level Ratio',
		select:['Any', 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
		help:'Smaller number for lower target level. Reduce this number if you\'re losing a lot'
	},{
		id:'force1',
		label:'Force +1',
		checkbox:true,
		help:'Force the first player in the list to aid.'
	},{
		title:'Siege Assist Options'
	},{
		id:'assist',
		label:'Assist with Sieges',
		help:'Spend stamina to assist with sieges.',
		checkbox:true
	},{
		id:'assist_links',
		label:'Use Assist Links in Dashboard',
		checkbox:true
	},{
		advanced:true,
		id:'check_interval',//monster_check
		label:'Monster Review',
		select:{
			900000:'15 Minutes',
			1800000:'30 Minutes',
			3600000:'Hourly',
			7200000:'2 Hours',
			21600000:'6 Hours',
			43200000:'12 Hours',
			86400000:'Daily',
			604800000:'Weekly'},
		help:'Sets how often to check Monster Stats.'
	}
];

Monster.types = {
	// Special (level 5) - not under Monster tab
	//	kull: {
	//		name:'Kull, the Orc Captain',
	//		timer:259200 // 72 hours
	//	},

	raid_easy: {
		name:'The Deathrune Siege',
		list:'deathrune_list1.jpg',
		image:'raid_title_raid_a1.jpg',
		image2:'raid_title_raid_a2.jpg',
		dead:'raid_1_large_victory.jpg',
		achievement:100,
		timer:216000, // 60 hours
		timer2:302400, // 84 hours
		raid:true
	},

	raid: {
		name:'The Deathrune Siege',
		list:'deathrune_list2.jpg',
		image:'raid_title_raid_b1.jpg',
		image2:'raid_title_raid_b2.jpg',
		dead:'raid_1_large_victory.jpg',
		achievement:100,
		timer:319920, // 88 hours, 52 minutes
		timer2:519960, // 144 hours, 26 minutes
		raid:true
	},
	// Epic Boss
	colossus: {
		name:'Colossus of Terra',
		list:'stone_giant_list.jpg',
		image:'stone_giant_large.jpg',
		dead:'stone_giant_dead.jpg',
		achievement:20000,
		timer:259200, // 72 hours
		mpool:1,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5]
	},
	gildamesh: {
		name:'Gildamesh, the Orc King',
		list:'orc_boss_list.jpg',
		image:'orc_boss.jpg',
		dead:'orc_boss_dead.jpg',
		achievement:15000,
		timer:259200, // 72 hours
		mpool:1,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5]
	},
	keira: {
		name:'Keira the Dread Knight',
		list:'boss_keira_list.jpg',
		image:'boss_keira.jpg',
		dead:'boss_keira_dead.jpg',
		achievement:30000,
		timer:172800, // 48 hours
		mpool:1,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5]
	},
	lotus: {
		name:'Lotus Ravenmoore',
		list:'boss_lotus_list.jpg',
		image:'boss_lotus.jpg',
		dead:'boss_lotus_big_dead.jpg',
		achievement:500000,
		timer:172800, // 48 hours
		mpool:1,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5]
	},
	mephistopheles: {
		name:'Mephistopheles',
		list:'boss_mephistopheles_list.jpg',
		image:'boss_mephistopheles_large.jpg',
		dead:'boss_mephistopheles_dead.jpg',
		achievement:100000,
		timer:172800, // 48 hours
		mpool:1,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5]
	},
	skaar: {
		name:'Skaar Deathrune',
		list:'death_list.jpg',
		image:'death_large.jpg',
		dead:'death_dead.jpg',
		achievement:1000000,
		timer:345000, // 95 hours, 50 minutes
		mpool:1,
		attack_button:'input[name="Attack Dragon"][src*="attack"]',
		attack:[1,5,10,20,50],
		defend_button:'input[name="Attack Dragon"][src*="dispel"]',
		defend:[10,20,40,100]
	},
	sylvanus: {
		name:'Sylvana the Sorceress Queen',
		list:'boss_sylvanus_list.jpg',
		image:'boss_sylvanus_large.jpg',
		dead:'boss_sylvanus_dead.jpg',
		achievement:50000,
		timer:172800, // 48 hours
		mpool:1,
		attack_button:'input[name="Attack Dragon"]',
		attack:[1,5]
	},
	// Epic Team
	dragon_emerald: {
		name:'Emerald Dragon',
		list:'dragon_list_green.jpg',
		image:'dragon_monster_green.jpg',
		dead:'dead_dragon_image_green.jpg',
		achievement:100000,
		timer:259200, // 72 hours
		mpool:2,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5]
	},
	dragon_frost: {
		name:'Frost Dragon',
		list:'dragon_list_blue.jpg',
		image:'dragon_monster_blue.jpg',
		dead:'dead_dragon_image_blue.jpg',
		achievement:100000,
		timer:259200, // 72 hours
		mpool:2,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5]
	},
	dragon_gold: {
		name:'Gold Dragon',
		list:'dragon_list_yellow.jpg',
		image:'dragon_monster_gold.jpg',
		dead:'dead_dragon_image_gold.jpg',
		achievement:100000,
		timer:259200, // 72 hours
		mpool:2,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5]
	},
	dragon_red: {
		name:'Ancient Red Dragon',
		list:'dragon_list_red.jpg',
		image:'dragon_monster_red.jpg',
		dead:'dead_dragon_image_red.jpg',
		achievement:100000,
		timer:259200, // 72 hours
		mpool:2,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5]
	},
	serpent_amethyst: { // DEAD image Verified and enabled.
		name:'Amethyst Sea Serpent',
		list:'seamonster_list_purple.jpg',
		image:'seamonster_purple.jpg',
		dead:'seamonster_dead.jpg',
		title:'seamonster_title_amethyst.jpg',
		achievement:250000,
		timer:259200, // 72 hours
		mpool:2,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5],
		defend_button:'input[name="Defend against Monster"]',
		defend:[10]
	},
	serpent_ancient: { // DEAD image Verified and enabled.
		name:'Ancient Sea Serpent',
		list:'seamonster_list_red.jpg',
		image:'seamonster_red.jpg',
		dead:'seamonster_dead.jpg',
		title:'seamonster_title_ancient.jpg',
		achievement:250000,
		timer:259200, // 72 hours
		mpool:2,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5],
		defend_button:'input[name="Defend against Monster"]',
		defend:[10]
	},
	serpent_emerald: { // DEAD image Verified and enabled.
		name:'Emerald Sea Serpent',
		list:'seamonster_list_green.jpg',
		image:'seamonster_green.jpg',
		dead:'seamonster_dead.jpg',
		title:'seamonster_title_emerald.jpg', //Guesswork. Needs verify.
		achievement:250000,
		timer:259200, // 72 hours
		mpool:2,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5],
		defend_button:'input[name="Defend against Monster"]',
		defend:[10]
	},
	serpent_sapphire: { // DEAD image guesswork based on others and enabled.
		name:'Sapphire Sea Serpent',
		list:'seamonster_list_blue.jpg',
		image:'seamonster_blue.jpg',
		dead:'seamonster_dead.jpg',
		title:'seamonster_title_sapphire.jpg',
		achievement:250000,
		timer:259200, // 72 hours
		mpool:2,
		attack_button:'input[name="Attack Dragon"]',
		siege:false,
		attack:[1,5],
		defend_button:'input[name="Defend against Monster"]',
		defend:[10]
	},
	// Epic World
	cronus: {
		name:'Cronus, The World Hydra',
		list:'hydra_head.jpg',
		image:'hydra_large.jpg',
		dead:'hydra_dead.jpg',
		achievement:500000,
		timer:604800, // 168 hours
		mpool:3,
		attack_button:'input[name="Attack Dragon"]',
		attack:[1,5,10,20,50]
	},
	legion: {
		name:'Battle of the Dark Legion',
		list:'castle_siege_list.jpg',
		image:'castle_siege_large.jpg',
		dead:'castle_siege_dead.jpg',
		achievement:1000,
		timer:604800, // 168 hours
		mpool:3,
		attack_button:'input[name="Attack Dragon"][src*="attack"]',
		attack:[1,5,10,20,50],
		defend_button:'input[name="Attack Dragon"][src*="fortify"]',
		defend:[10,20,40,100],
		orcs:true
	},
	genesis: {
		name:'Genesis, The Earth Elemental',
		list:'earth_element_list.jpg',
		image:'earth_element_large.jpg',
		dead:'earth_element_dead.jpg',
		achievement:1000000,
		timer:604800, // 168 hours
		mpool:3,
		attack_button:'input[name="Attack Dragon"][src*="attack"]',
		attack:[1,5,10,20,50],
		defend_button:'input[name="Attack Dragon"][src*="fortify"]',
		defend:[10,20,40,100]
	},
	ragnarok: {
		name:'Ragnarok, The Ice Elemental',
		list:'water_list.jpg',
		image:'water_large.jpg',
		dead:'water_dead.jpg',
		achievement:1000000,
		timer:604800, // 168 hours
		mpool:3,
		attack_button:'input[name="Attack Dragon"][src*="attack"]',
		attack:[1,5,10,20,50],
		defend_button:'input[name="Attack Dragon"][src*="dispel"]',
		defend:[10,20,40,100]
	},
	bahamut: {
		name:'Bahamut, the Volcanic Dragon',
		list:'nm_volcanic_list.jpg',
		image:'nm_volcanic_large.jpg',
		dead:'nm_volcanic_dead.jpg',
		achievement:1000000, // Guesswork
		timer:604800, // 168 hours
		mpool:3,
		attack_button:'input[name="Attack Dragon"][src*="stab"],input[name="Attack Dragon"][src*="bolt"],input[name="Attack Dragon"][src*="smite"],input[name="Attack Dragon"][src*="bash"]',
		attack:[5,10,20,50],
		defend_button:'input[name="Attack Dragon"][src*="heal"],input[name="Attack Dragon"][src*="cripple"],input[name="Attack Dragon"][src*="deflect"]',
		defend:[10,20,40,100]
	},
	alpha_bahamut: {
		name:'Alpha Bahamut, the Volcanic Dragon',
		list:'nm_volcanic_list_2.jpg',
		image:'nm_volcanic_large_2.jpg',
		dead:'nm_volcanic_dead_2.jpg', //Guesswork
		achievement:3000000, // Guesswork
		timer:604800, // 168 hours
		mpool:3,
		attack_button:'input[name="Attack Dragon"][src*="stab"],input[name="Attack Dragon"][src*="bolt"],input[name="Attack Dragon"][src*="smite"],input[name="Attack Dragon"][src*="bash"]',
		attack:[5,10,20,50],
		defend_button:'input[name="Attack Dragon"][src*="heal"],input[name="Attack Dragon"][src*="cripple"],input[name="Attack Dragon"][src*="deflect"]',
		defend:[10,20,40,100]
	},
	azriel: {
		name:'Azriel, the Angel of Wrath',
		list:'nm_azriel_list.jpg',
		image:'nm_azriel_large2.jpg',
		dead:'nm_azriel_dead.jpg', //Guesswork
		achievement:3000000, // ~0.5%, 2X = ~1%
		timer:604800, // 168 hours
		mpool:1,
		attack_button:'input[name="Attack Dragon"][src*="stab"],input[name="Attack Dragon"][src*="bolt"],input[name="Attack Dragon"][src*="smite"],input[name="Attack Dragon"][src*="bash"]',
		attack:[5,10,20,50],
		defend_button:'input[name="Attack Dragon"][src*="heal"],input[name="Attack Dragon"][src*="cripple"],input[name="Attack Dragon"][src*="deflect"]',
		defend:[10,20,40,100]
	},
	red_plains: {
		name:'War of the Red Plains',
		list:'nm_war_list.jpg',
		image:'nm_war_large.jpg',
		dead:'nm_war_dead.jpg', //Guesswork
		achievement:1500, // ~0.5%, 2X = ~1%
		timer:604800, // 168 hours
		mpool:3,
		attack_button:'input[name="Attack Dragon"][src*="stab"],input[name="Attack Dragon"][src*="bolt"],input[name="Attack Dragon"][src*="smite"],input[name="Attack Dragon"][src*="bash"]',
		attack:[5,10,20,50],
		defend_button:'input[name="Attack Dragon"][src*="heal"],input[name="Attack Dragon"][src*="cripple"],input[name="Attack Dragon"][src*="deflect"]',
		defend:[10,20,40,100],
		orcs:true
	},
	alpha_meph: {
		name:'Alpha Mephistopheles',
		list:'nm_alpha_mephistopheles_list.jpg',
		image:'nm_mephistopheles2_large.jpg',
		dead:'nm_mephistopheles2_dead.jpg', 
		achievement:3200000, // ~0.5%, 2X = ~1%
		timer:604800, // 168 hours
		mpool:3,
		attack_button:'input[name="Attack Dragon"][src*="stab"],input[name="Attack Dragon"][src*="bolt"],input[name="Attack Dragon"][src*="smite"],input[name="Attack Dragon"][src*="bash"]',
		attack:[5,10,20,50],
		defend_button:'input[name="Attack Dragon"][src*="heal"],input[name="Attack Dragon"][src*="cripple"],input[name="Attack Dragon"][src*="deflect"]',
		defend:[10,20,40,100]
	}
};

Monster.health_img = ['img[src$="nm_red.jpg"]', 'img[src$="monster_health_background.jpg"]'];
Monster.shield_img = ['img[src$="bar_dispel.gif"]'];
Monster.defense_img = ['img[src$="nm_green.jpg"]', 'img[src$="seamonster_ship_health.jpg"]'];
Monster.secondary_img = 'img[src$="nm_stun_bar.gif"]';
Monster.class_img = ['div[style*="nm_bottom"] img[src$="nm_class_warrior.jpg"]',
				'div[style*="nm_bottom"] img[src$="nm_class_cleric.jpg"]',
				'div[style*="nm_bottom"] img[src$="nm_class_rogue.jpg"]',
				'div[style*="nm_bottom"] img[src$="nm_class_mage.jpg"]',
				'div[style*="nm_bottom"] img[src$="nm_class_ranger.jpg"]',
				'div[style*="nm_bottom"] img[src$="nm_class_warlock.jpg"]'];
Monster.class_name = ['Warrior', 'Cleric', 'Rogue', 'Mage', 'Ranger', 'Warlock'];
Monster.secondary_off = 'img[src$="nm_s_off_cripple.gif"],img[src$="nm_s_off_deflect.gif"]';
Monster.secondary_on = 'input[name="Attack Dragon"][src*="cripple"],input[name="Attack Dragon"][src*="deflect"]';
Monster.warrior = 'input[name="Attack Dragon"][src*="strengthen"]';

Monster.init = function() {
	this._watch(Player);
	this._watch(Queue);
	this._revive(60);
	$('#golem-dashboard-Monster tbody td a').live('click', function(event){
		var url = $(this).attr('href');
		Page.to((url.indexOf('raid') > 0 ? 'battle_raid' : 'monster_battle_monster'), url.substr(url.indexOf('?')), false);
		return false;
	});
	Resources.use('Energy');
	Resources.use('Stamina');
	delete this.runtime.record;
};

Monster.parse = function(change) {
	if (change) {
		return false;
	}
	var mid, uid, type_label, $health, $defense, $dispel, $secondary, dead = false, monster, timer, ATTACKHISTORY = 20, data = this.data, types = this.types, now = Date.now();
	if (Page.page === 'keep_monster_active' || Page.page === 'monster_battle_monster') { // In a monster or raid
		uid = $('img[linked][size="square"]').attr('uid');
		//debug('Parsing for Monster type');
		for (i in types) {
			if (types[i].dead && $('#app'+APPID+'_app_body img[src$="'+types[i].dead+'"]').length && (!types[i].title || $('div[style*="'+types[i].title+'"]').length)) {
				//debug('Found a dead '+i);
				type_label = i;
				timer = types[i].timer;
				dead = true;
				break;
			} else if (types[i].image && $('#app'+APPID+'_app_body img[src$="'+types[i].image+'"],div[style*="'+types[i].image+'"]').length) {
				//debug('Parsing '+i);
				type_label = i;
				timer = types[i].timer;
				break;
			} else if (types[i].image2 && $('#app'+APPID+'_app_body img[src$="'+types[i].image2+'"],div[style*="'+types[i].image2+'"]').length) {
				//debug('Parsing second stage '+i);
				type_label = i;
				timer = types[i].timer2 || types[i].timer;
				break;
			}
		}
		if (!uid || !type_label) {
			debug('Unknown monster (probably dead)');
			return false;
		}
		mid = uid+'_'+(types[i].mpool || 4);
		if (this.runtime.check === mid) {
			this.runtime.check = false;
		}
		monster = data[mid] = data[mid] || {};
		monster.type = type_label;
		type = types[type_label];
		monster.last = now;
		if (dead) {
			// Will this catch Raid format rewards?
			if ($('input[src*="collect_reward_button.jpg"]').length || monster.state === 'engage') {
				if (monster.ac) { // Collect reward immediately
					monster.last = 0;
				}
				monster.state = 'reward';
			} else if (monster.state === 'assist') {
				monster.state = null;
				return false;
			}
		}
		monster.stamina = monster.stamina || {};
		monster.damage = monster.damage || {};
		monster.damage.user = monster.damage.user || {};
		monster.energy = monster.energy || {};
		monster.defend = monster.defend || {};
		if ($('span.result_body').text().match(/for your help in summoning|You have already assisted on this objective|You don't have enough stamina assist in summoning/i)) {
			if ($('span.result_body').text().match(/for your help in summoning/i)) {
				monster.assist = now;
			}
			monster.state = monster.state || 'assist';
		} else if (this.runtime.stamina_used) {
			if ($('span[class="positive"]').length && $('span[class="positive"]').prevAll('span').text().replace(/[^0-9\/]/g,'')) {
				calc_rolling_weighted_average(this.runtime
						,'damage',Number($('span[class="positive"]').prevAll('span').text().replace(/[^0-9\/]/g,''))
						,'stamina',this.runtime.stamina_used);
				//debug('Damage per stamina = ' + this.runtime.avg_damage_per_stamina);
			}
			this.runtime.stamina_used = 0;
		} else if (this.runtime.energy_used) {
			if ($('span[class="positive"]').length && $('span[class="positive"]').prevAll('span').text().replace(/[^0-9\/]/g,'')) {
				calc_rolling_weighted_average(this.runtime
						,'defend',Number($('span[class="positive"]').prevAll('span').text().replace(/[^0-9\/]/g,''))
						,'energy',this.runtime.energy_used);
				//debug('Defend per energy = ' + this.runtime.avg_defend_per_energy);
			}
			this.runtime.energy_used = 0;
		}
		if ($('img[src$="battle_victory"]').length) {
			History.add('raid+win',1);
		} else if ($('img[src$="battle_defeat"]').length) {
			History.add('raid+loss',-1);
		}
		if (!monster.name) {
			monster.name = $('img[linked][size="square"]').parent().parent().next().text().trim().replace(/[\s\n\r]{2,}/g, ' ').regex(/(.+)'s /i);
		}
		// Need to also parse what our class is for Bahamut.  (Can probably just look for the strengthen button to find warrior class.)
		for (i in Monster['class_img']){
			if ($(Monster['class_img'][i]).length){
				monster.mclass = i;
				break;
				//debug('Monster class : '+Monster['class_name'][i]);
			}
		}
		if ($(Monster.warrior).length) {
			monster.warrior = true;
		}
		if ($(Monster.secondary_off).length) {
			monster.secondary = 100;
		} else if ($(Monster.secondary_on).length) {
			monster.secondary = 0.01; // Prevent from defaulting to false
			$secondary = $(Monster['secondary_img']);
			if ($secondary.length) {
				monster.secondary = (100 * $secondary.width() / $secondary.parent().width());
				//debug(Monster['class_name'][monster.mclass]+" phase. Bar at "+monster.secondary+"%");
			}
		}
		// If we have some other class but no cleric button, then we can't heal.  
		if ((monster.secondary || monster.warrior) && !$(type.defend_button).length) {
			monster.no_heal = true;
		}
		for (i in Monster['health_img']){
			if ($(Monster['health_img'][i]).length){
				$health = $(Monster['health_img'][i]).parent();
				monster.health = $health.length ? (100 * $health.width() / $health.parent().width()) : 0;
				break;
			}
		}
		for (i in Monster['shield_img']){
			if ($(Monster['shield_img'][i]).length){
				$dispel = $(Monster['shield_img'][i]).parent();
				monster.defense = 100 * (1 - ($dispel.width() / ($dispel.next().length ? $dispel.width() + $dispel.next().width() : $dispel.parent().width())));
				break;
			}
		}
		for (i in Monster['defense_img']){
			if ($(Monster['defense_img'][i]).length){
				$defense = $(Monster['defense_img'][i]).parent();
				monster.defense = ($defense.width() / ($defense.next().length ? $defense.width() + $defense.next().width() : $defense.parent().width()) * 100);
				if ($defense.parent().width() < $defense.parent().parent().width()){
					monster.strength = 100 * $defense.parent().width() / $defense.parent().parent().width();
				} else {
					monster.strength = 100;
				}
				monster.defense = monster.defense * (monster.strength || 100) / 100;
				break;
			}
		}
		monster.timer = $('#app'+APPID+'_monsterTicker').text().parseTimer();
		monster.finish = now + (monster.timer * 1000);
		monster.damage.siege = 0;
		monster.damage.others = 0;
		if (!dead &&$('input[name*="help with"]').length && $('input[name*="help with"]').attr('title')) {
			//debug('Current Siege Phase is: '+ this.data[mid].phase);
			monster.phase = $('input[name*="help with"]').attr('title').regex(/ (.*)/i);
			//debug('Assisted on '+monster.phase+'.');
		}
		$('img[src*="siege_small"]').each(function(i,el){
			var /*siege = $(el).parent().next().next().next().children().eq(0).text(),*/ dmg = $(el).parent().next().next().next().children().eq(1).text().replace(/[^0-9]/g,'').regex(/([0-9]+)/);
			//debug('Monster Siege',siege + ' did ' + addCommas(dmg) + ' amount of damage.');
			monster.damage.siege += dmg / (types[type_label].orcs ? 1000 : 1);
		});
		$('td.dragonContainer table table a[href^="http://apps.facebook.com/castle_age/keep.php?casuser="]').each(function(i,el){
			var user = $(el).attr('href').regex(/user=([0-9]+)/i), tmp, dmg, fort;
			if (types[type_label].raid){
				tmp = $(el).parent().next().text().replace(/[^0-9\/]/g,'');
			} else {
				tmp = $(el).parent().parent().next().text().replace(/[^0-9\/]/g,'');
			}
			dmg = tmp.regex(/([0-9]+)/);
			fort = tmp.regex(/\/([0-9]+)/);
			if (user === userID){
				monster.damage.user.manual = dmg - (monster.damage.user.script || 0);
				monster.defend.manual = fort - (monster.defend.script || 0);
				monster.stamina.manual = Math.round(monster.damage.user.manual / Monster.runtime.avg_damage_per_stamina);
			} else {
				monster.damage.others += dmg;
			}
		});
		if (monster.state === 'assist' && monster.damage.user && sum(monster.damage.user)) {// If we're doing our first attack then add them without having to visit list
			monster.state = 'engage';
		}
		monster.dps = sum(monster.damage) / (timer - monster.timer);
		if (types[type_label].raid) {
			monster.total = sum(monster.damage) + $('div[style*="monster_health_back.jpg"] div:nth-child(2)').text().regex(/([0-9]+)/);
		} else {
			monster.total = Math.ceil(100 * sum(monster.damage) / (monster.health === 100 ? 0.1 : (100 - monster.health)));
		}
		monster.eta = now + (Math.floor((monster.total - sum(monster.damage)) / monster.dps) * 1000);
	} else {
		this.runtime.stamina_used = 0;
		this.runtime.energy_used = 0;
		if (Page.page === 'monster_monster_list' || Page.page === 'battle_raid') { // Check monster / raid list
			if ($('div[style*="no_monster_back.jpg"]').attr('style')){
				debug('Found a timed out monster.');
				if (this.runtime.check){
					debug('Deleting ' + data[this.runtime.check].name + "'s " + data[this.runtime.check].type);
					delete data[this.runtime.check];
				} else {
					debug('Unknown monster (timed out)');
				}
				this.runtime.check = false;
				return false;
			}
			this.runtime.check = false;

			if (!$('#app'+APPID+'_app_body div.imgButton').length) {
				return false;
			}
			for (mid in data) {
				if (	(types[data[mid].type].raid 
							? Page.page === 'battle_raid'
							: Page.page === 'monster_monster_list')
						&& (data[mid].state === 'complete'
							|| data[mid].state === 'reward'
							|| (data[mid].state === 'assist'
								&& data[mid].finish < now))
					) {
					data[mid].state = null;
				}
			}
			$('#app'+APPID+'_app_body div.imgButton').each(function(a,el){
				var i, uid = $('a', el).attr('href').regex(/casuser=([0-9]+)/i), tmp = $(el).parent().parent().children().eq(1).html().regex(/graphics\/([^.]*\....)/i), type_label = null;
				if (!uid) {
					return;
				}
				for (i in types) {
					if (tmp === types[i].list) {
						type_label = i;
						break;
					}
				}
				if (!type_label) {
					debug('Unable to add monster - uid: '+uid+', image: "'+tmp+'"');
					return;
				}
				mid = uid+'_'+(types[i].mpool || 4);
				data[mid] = data[mid] || {};
				data[mid].type = type_label;
				if (uid === userID) {
					data[mid].name = 'You';
				} else {
					tmp = $(el).parent().parent().children().eq(2).text().trim();
					data[mid].name = tmp.regex(/(.+)'s /i);
				}
				switch($('img', el).attr('src').regex(/dragon_list_btn_([0-9])/)) {
					case 2:
						data[mid].state = 'reward';
						break;
					case 3:
						data[mid].state = 'engage';
						break;
					case 4:
						if (Monster.types[data[mid].type].raid && data[mid].health && data[mid].finish > now) { // Fix for Raids that no longer show "Engage" as the image
							data[mid].state = 'engage';
						} else {
							data[mid].state = 'complete';
						}
						break;
					default:
						data[mid].state = 'unknown';
						break; // Should probably delete, but keep it on the list...
				}
			});
		}
	}
	return false;
};

Monster.update = function(what,worker) {
	if (what === 'runtime') {
		return;
	}
	var i, mid, uid, type, req_stamina, req_health, req_energy, messages = [], fullname = {}, list = {}, amount, listSortFunc, matched_mids = [];
	list.defend = [];
	list.attack = [];
	// Flush stateless monsters
	for (mid in this.data) {
		if (!this.data[mid].state) {
			log('Deleted monster MID ' + mid + ' because state is ' + this.data[mid].state);
			delete this.data[mid];
		}
	}
	// Check for unviewed monsters
	for (mid in this.data) {
		if (!this.data[mid].last && !this.data[mid].ignore) {
			this.runtime.check = mid;
			Dashboard.status(this, 'Reviewing ' +
					(this.data[mid].name === 'You' ? 'Your' : this.data[mid].name) + ' ' 
					+ this.types[this.data[mid].type].name);
			return;
		}
	}
	// Some generals use more stamina, but only in certain circumstances...
	this.runtime.multiplier = (Generals.get([Generals.best(this.option['best_attack'] 
			? 'monster_attack' 
			: this.option['general_attack']), 'skills'], '').regex(/Increase Power Attacks by ([0-9]+)/i) || 1);
	this.runtime.secondary = false;
	if (this.option.stop === 'Priority List') {
		var condition, searchterm, attack_found = false, defend_found = false, attack_overach = false, defend_overach = false, damage, o, suborder, p, defense_kind;
		var order = this.option.priority.toLowerCase().replace(/ *[\n,]+ */g,',').replace(/,*\|,*/g,'|').split(',');
		order.push('your ','\'s'); // Catch all at end in case no other match
		for (var o in order) {
			order[o] = order[o].trim();
			if (!order[o]) {
				continue;
			}
			if (order[o] === 'levelup') {
				if (LevelUp.get('runtime.running')) {
					match_mids = [];
					continue;
				} else {
					break;
				}
			}
			suborder = order[o].split('|');
			for (var p in suborder) {
				suborder[p] = suborder[p].trim();
				if (!suborder[p]) {
					continue;
				}
				searchterm = $.trim(suborder[p].match(new RegExp("^[^:]+")).toString());
				condition = $.trim(suborder[p].replace(new RegExp("^[^:]+"), '').toString());
				//debug('Priority order ' + searchterm +' condition ' + condition);
				for (mid in this.data) {
					monster = this.data[mid];
					type = this.types[monster.type];
					//If this monster does not match, skip to next one
					// Or if this monster is dead, skip to next one
					if (	matched_mids.indexOf(mid)>=0
							||((monster.name === 'You' ? 'Your' : monster.name + '\'s')
								+ ' ' + type.name).toLowerCase().indexOf(searchterm) < 0
							|| monster.ignore) {
						continue;
					}
					if (/:ac\b/.test(condition)) {
						monster.ac = true;
					}
					if (monster.state !== 'engage') {
						continue;
					}
					matched_mids.push(mid);
					//Monster is a match so we set the conditions
					monster.max = this.conditions('max',condition);
					monster.ach = Math.min(this.conditions('ach',condition) || type.achievement,monster.max);
					monster.defend_max = this.conditions('f%',condition) || this.option.defend;
					damage = sum(monster.damage.user) + sum(monster.defend);

					if ((attack_found || o) === o 
							&& monster.defense >= Math.max(this.option.min_to_attack,0.1)) {
						if (damage < monster.ach) {
							attack_found = o;
							if (attack_found && attack_overach) {
								list.attack = [[mid, damage / sum(monster.damage), type.attack_button]];
								attack_overach = false;
							} else {
								list.attack.push([mid, damage / sum(monster.damage), type.attack_button]);
							}
							//debug('ATTACK monster ' + monster.name + ' ' + type.name);
						} else if ((monster.max === false || damage < monster.max) 
								&& !attack_found && (attack_overach || o) === o) {
							list.attack.push([mid, damage / sum(monster.damage), type.attack_button]);
							attack_overach = o;
						}
					}

					// Possible defend target?
					if (this.option.defend_active 
							&& (defend_found || o) === o) {
						defense_kind = false;
						if (typeof monster.secondary !== 'undefined' && monster.secondary < 100) {
							defense_kind = Monster.secondary_on;
						} else if (monster.warrior && (monster.strength || 100) < 100) {
							defense_kind = Monster.warrior;
						} else if ((monster.defense || 100) 
									< Math.min(monster.defend_max, monster.strength -1)
								&& !monster.no_heal) {
							defense_kind = type.defend_button;
						}
						if (monster.secondary === 100  
								&& (monster.max === false 
									|| damage < monster.max
									|| /:sec\b/.test(condition))) {
							this.runtime.secondary = true;
						}
						if (defense_kind && (defend_found || o) === o) {
							if (damage < monster.ach
									|| (/:sec\b/.test(condition)
										&& defense_kind === Monster.secondary_on)) {
								//debug('DEFEND monster ' + monster.name + ' ' + type.name);
								defend_found = o;
							} else if ((monster.max === false || damage < monster.max) 
									&& !defend_found && (defend_overach || o) === o) {
								defend_overach = o;
							} else {
								continue;
							}
							if (defend_found && defend_overach) {
								list.defend = [[mid, damage / sum(monster.damage), defense_kind]];
								defend_overach = false;
							} else {
								list.defend.push([mid, damage / sum(monster.damage), defense_kind]);
							}
						}
					}
				}
			}
		}
		delete matched_mids;
	} else {
		// Make lists of the possible attack and defend targets
		for (mid in this.data) {
			monster = this.data[mid];
			type = this.types[monster.type];
			req_stamina = type.raid ? (this.option.raid.search('x5') === -1 ? 1 : 5)
					: (this.option.attack_min < Math.min.apply(Math, type.attack)
						|| this.option.attack_max <= Math.min.apply(Math, type.attack))
					? Math.min.apply( Math, type.attack)
					: this.option.attack_min > Math.max.apply(Math, type.attack)
					? Math.max.apply(Math, type.attack)
					: this.option.attack_min > this.option.attack_max
					? this.option.attack_max : this.option.attack_min;
			req_stamina = type.raid ? req_stamina : req_stamina * this.runtime.multiplier;
//			req_energy = this.runtime.defend_button ? this.option.defend_min * this.runtime.multiplier : null;
			req_energy = this.runtime.defend_button ? this.option.defend_min : null;
			req_health = type.raid ? (this.option.risk ? 13 : 10) : 10; // Don't want to die when attacking a raid
                        monster.ach = (this.option.stop === 'Achievement') ? type.achievement : (this.option.stop === '2X Achievement') ? type.achievement*2 : 0;
			monster.max = (this.option.stop === 'Achievement') ? type.achievement : (this.option.stop === '2X Achievement') ? type.achievement*2 : 0;
			if (	!monster.ignore
					&& monster.state === 'engage'
					&& monster.finish > Date.now()	) {
				uid = mid.replace(/_\d+/,'');                                
				if (uid == userID && this.option.own) {                                 
					// add own monster
				} else if (this.option.avoid_lost_cause
						&& (monster.eta - monster.finish)/3600000
							> this.option.lost_cause_hours) {
					continue;  // Avoid lost cause monster
				} else if (this.option.rescue
						&& (monster.eta
							>= monster.finish - this.option.check_interval)) {
					// Add monster to rescue
				} else if (this.option.stop === 'Achievement'
						&& sum(monster.damage.user) + sum(monster.defend)
							> (type.achievement || 0)) {
					continue; // Don't add monster over achievement
				} else if (this.option.stop === '2X Achievement'
						&& sum(monster.damage.user) + sum(monster.defend)
							> type.achievement * 2) {
					continue; // Don't add monster over 2X  achievement
				}
				// Possible attack target?
				if ((!this.option.hide || (Player.get('health') >= req_health && Queue.burn.stamina >= req_stamina))
					&& ((monster.defense || 100) >= Math.max(this.option.min_to_attack,0.1))) {
					list.attack.push([mid, (sum(monster.damage.user) + sum(monster.defend)) / sum(monster.damage), type.attack_button]);
				}
				// Possible defend target?
				if (this.option.defend_active) {
					if ((monster.secondary || 100) < 100) {
						list.defend.push([mid, (sum(monster.damage.user) + sum(monster.defend)) / sum(monster.damage), Monster.secondary_on]);
					} else if (monster.warrior && (monster.strength || 100) < 100){
						list.defend.push([mid, (sum(monster.damage.user) + sum(monster.defend)) / sum(monster.damage), Monster.warrior]);
					} else if ((monster.defense || 100) < Math.min(this.option.defend, (monster.strength -1 || 100))
                                                && !monster.no_heal) {
						list.defend.push([mid, (sum(monster.damage.user) + sum(monster.defend)) / sum(monster.damage), type.defend_button]);
					}
				}
			}
		}
	}
	listSortFunc = function(a,b){
		var monster_a = Monster.data[a[0]], monster_b = Monster.data[b[0]];
		switch(Monster.option.choice) {
		case 'Any':
			return (Math.random()-0.5);
		case 'Strongest':
			return monster_b.health - monster_a.health;
		case 'Weakest':
			return monster_a.health - monster_b.health;
		case 'Shortest ETD':
			return monster_a.eta - monster_b.eta;
		case 'Longest ETD':
			return monster_b.eta - monster_a.eta;
		case 'Spread':
			return sum(monster_a.stamina) - sum(monster_b.stamina);
		case 'Max Damage':
			return b[1] - a[1];
		case 'Min Damage':
			return a[1] - b[1];
		case 'ETD Maintain':
			return monster_b.finish - monster_a.finish;
		}
	};
	for (i in list) {
		// Find best target
		// debug('list ' + i + ' is ' + list[i]);
		if (list[i].length) {
			if (list[i].length > 1) {
				list[i].sort(listSortFunc);
			}
			this.runtime[i] = mid = list[i][0][0];
			this.runtime[i + '_button'] = list[i][0][2];
			uid = mid.replace(/_\d+/,'');
			type = this.types[this.data[mid].type];
			fullname[i] = (uid === userID ? 'your ': (this.data[mid].name + '\'s ')) + type.name;
		} else {
			this.runtime[i] = false;
		}
	}
	// Make the * dash messages for current attack and defend targets
	if (this.runtime.defend) {
		type = this.types[this.data[this.runtime.defend].type];
		this.runtime.energy = (!type.defend) ? 10
				: (this.option.defend_min < Math.min.apply(Math, type.defend)
					|| this.option.defend_max < Math.min.apply(Math, type.defend))
				? Math.min.apply(Math, type.defend)
				: (this.option.defend_min > Math.max.apply(Math, type.defend))
				? Math.max.apply(Math, type.defend)
				: (this.option.defend_min > this.option.defend_max)
				? this.option.defend_max : this.option.defend_min;
//		this.runtime.energy *= this.runtime.multiplier;
		if (Queue.burn.energy < this.runtime.energy) {
			req_energy = (LevelUp.runtime.running && LevelUp.option.enabled)
					? (this.runtime.energy - Queue.burn.energy)
					: Math.max((this.runtime.energy - Queue.burn.energy)
						,(this.runtime.energy + Queue.option.energy - Player.get('energy'))
						,(Queue.option.start_energy - Player.get('energy')));
			messages.push('Waiting for ' + makeImage('energy') + req_energy + ' to defend '
					+ fullname.defend + ' (' + makeImage('energy') + this.runtime.energy + '+)');
		} else {
			messages.push('Defend '	+ fullname.defend + ' (' + makeImage('energy')
					+ this.runtime.energy + '+)');
		}
	}
	if (this.runtime.attack) {
		type = this.types[this.data[this.runtime.attack].type];
		this.runtime.stamina = type.raid && this.option.raid.search('x5') === -1
			? 1
			: type.raid
				? 5
				: (this.option.attack_min < Math.min.apply(Math, type.attack) || this.option.attack_max < Math.min.apply(Math, type.attack))
					? Math.min.apply(Math, type.attack)
					: (this.option.attack_min > Math.max.apply(Math, type.attack))
						? Math.max.apply(Math, type.attack)
						: (this.option.attack_min > this.option.attack_max)
							? this.option.attack_max
							: this.option.attack_min;
		this.runtime.stamina = type.raid ? this.runtime.stamina : this.runtime.stamina * this.runtime.multiplier;
		this.runtime.health = type.raid ? 13 : 10; // Don't want to die when attacking a raid
		req_health = Math.max(0, this.runtime.health - Player.get('health'));
		req_stamina = Math.max(0, (LevelUp.runtime.running && LevelUp.option.enabled)
			? (this.runtime.stamina - Queue.burn.stamina)
			: Math.max((this.runtime.stamina - Queue.burn.stamina)
				,(this.runtime.stamina + Queue.option.stamina - Player.get('stamina'))
				,(Queue.option.start_stamina - Player.get('stamina'))));
		if (Battle.runtime.points && this.option.points){
                        messages.push('Battling for Demi-Points.');
                } else if (req_stamina || req_health) {
			messages.push('Waiting for ' + (req_stamina ? makeImage('stamina') + req_stamina : '') + (req_stamina && req_health ? ' &amp; ' : '') + (req_health ? makeImage('health') + req_health : '') + ' to attack ' + fullname.attack + ' (' + makeImage('stamina') + this.runtime.stamina + '+' + (req_stamina && req_health ? ', ' : '') + (req_health ? makeImage('health') + req_health : '') + ')');
		} else {
			messages.push('Attack ' + fullname.attack + ' (' + makeImage('stamina')
					+ this.runtime.stamina + '+)');
		}
	}
	// Nothing to attack, so look for monsters we haven't reviewed for a while.
	if ((!this.runtime.defend || Queue.burn.energy < this.runtime.energy)
			&& (!this.runtime.attack || req_stamina || req_health)) {
		for (mid in this.data) {
			if (	this.data[mid].last < Date.now() - this.option.check_interval
					&& !this.data[mid].ignore) {
				this.runtime.check = mid;
				Dashboard.status(this, 'Reviewing ' +
						(this.data[mid].name === 'You' ? 'Your' : this.data[mid].name) + ' ' 
						+ this.types[this.data[mid].type].name);
				return;
			}
		}
	}
                Dashboard.status(this, messages.length ? messages.join('<br>') : 'Nothing to do.');
};

Monster.work = function(state) {
	var i, j, target_info = [], battle_list, list = [], mid, uid, type, btn = null, b, mode = null, stat, monster, title;
	if (this.runtime.defend && Queue.burn.energy >= this.runtime.energy) {
                mode = 'defend';
		stat = 'energy';
	} else if (this.runtime.attack && Player.get('health') >= this.runtime.health
			&& Queue.burn.stamina >= this.runtime.stamina && !(Battle.runtime.points && this.option.points)) {
		mode = 'attack';
		stat = 'stamina';
	}
	if (!this.runtime.check && !mode) {
		return QUEUE_FINISH;
	}        
	if (!state) {
		return QUEUE_CONTINUE;
	}
	if (this.runtime.check) {
		monster = this.data[this.runtime.check];
		uid = this.runtime.check.replace(/_\d+/,'');
		type = this.types[monster.type];
		debug( 'Reviewing ' + monster.name + '\'s ' + type.name);
		Page.to(
			type.raid
				? 'battle_raid'
				: 'monster_battle_monster',
			'casuser=' + uid + ((monster.phase && this.option.assist) ? '&action=doObjective' : '') + (type.mpool ? '&mpool=' + type.mpool : '') + ((monster.ac && monster.state === 'reward') ? '&action=collectReward' : ''));
		return QUEUE_RELEASE;
	}
 	uid = this.runtime[mode].replace(/_\d+/,'');
	monster = this.data[this.runtime[mode]];
	type = this.types[monster.type];
	if (!Generals.to(this.option['best_'+mode] 
			? (type.raid
				? ((this.option.raid.search('Invade') === -1) ? 'raid-duel' : 'raid-invade')
				: 'monster_' + mode)
			: this.option['general_'+mode])) {
		return QUEUE_CONTINUE;
	}
	if (type.raid) { // Raid has different buttons
		switch(this.option.raid) {
		case 'Invade':
			btn = $('input[src$="raid_attack_button.gif"]:first');
			break;
		case 'Invade x5':
			btn = $('input[src$="raid_attack_button3.gif"]:first');
			break;
		case 'Duel':
			btn = $('input[src$="raid_attack_button2.gif"]:first');
			break;
		case 'Duel x5':
			btn = $('input[src$="raid_attack_button4.gif"]:first');
			break;
		}
	} else {
		//Primary method of finding button.
		debug('Try to ' + mode + ' ' + monster.name + '\'s ' + type.name);
		if (this.option[mode + '_max'] <= type[mode][0]) {
			btn = $(this.runtime[mode + '_button']).eq(0);
		} else {
			b = $(this.runtime[mode + '_button']).length - 1;
			for (i=b; i >= 0; i--){
				//debug('Burn ' + stat + ' is ' + Queue.burn[stat]);
                                 if (	type[mode][i] <= this.option[mode + '_max']
						&& Queue.burn[stat] >= type[mode][i] ) {
					//debug('Button cost is ' + type.defend[i]);
					this.runtime[stat + '_used'] = type[mode][i] * this.runtime.multiplier;
					btn = $(this.runtime[mode + '_button']).eq(i);
					break;
				}
			}
		}
		if (!btn || !btn.length){
			monster.button_fail = (monster.button_fail || 0) + 1;
			if (monster.button_fail > 10){
				log('Ignoring Monster ' + monster.name + '\'s ' + type.name + ': Unable to locate ' + mode + ' button ' + monster.button_fail + ' times!');
				monster.ignore = true;
				monster.button_fail = 0;
			}
		}
	}
	if (!btn || !btn.length ||
			(Page.page !== 'keep_monster_active'
				&& Page.page !== 'monster_battle_monster')
			|| ($('div[style*="dragon_title_owner"] img[linked]').attr('uid') !== uid
				&& $('div[style*="nm_top"] img[linked]').attr('uid') !== uid)) {
		//debug('Reloading page. Button = ' + btn.attr('name'));
		//debug('Reloading page. Page.page = '+ Page.page);
		//debug('Reloading page. Monster Owner UID is ' + $('div[style*="dragon_title_owner"] img[linked]').attr('uid') + ' Expecting UID : ' + uid);
		Page.to(type.raid ? 'battle_raid' : 'monster_battle_monster', '?casuser=' + uid
				+ ((monster.phase && this.option.assist) ? '&action=doObjective' : '')
				+ (type.mpool ? '&mpool=' + type.mpool : ''));
		return QUEUE_CONTINUE; // Reload if we can't find the button or we're on the wrong page
	}
	if (type.raid) {
		battle_list = Battle.get('user');
		if (this.option.force1) { // Grab a list of valid targets from the Battle Worker to substitute into the Raid buttons for +1 raid attacks.
			for (i in battle_list) {
				list.push(i);
			}
			$('input[name*="target_id"]').val((list[Math.floor(Math.random() * (list.length))] || 0)); // Changing the ID for the button we're gonna push.
		}
		target_info = $('div[id*="raid_atk_lst0"] div div').text().regex(/Lvl\s*([0-9]+).*Army: ([0-9]+)/);
		if ((this.option.armyratio !== 'Any' && ((target_info[1]/Player.get('army')) > this.option.armyratio) && this.option.raid.indexOf('Invade') >= 0) || (this.option.levelratio !== 'Any' && ((target_info[0]/Player.get('level')) > this.option.levelratio) && this.option.raid.indexOf('Invade') === -1)){ // Check our target (first player in Raid list) against our criteria - always get this target even with +1
			log('No valid Raid target!');
			Page.to('battle_raid', ''); // Force a page reload to change the targets
			return QUEUE_CONTINUE;
		}
	}
	Page.click(btn);
	monster.button_fail = 0;
	return QUEUE_RELEASE;
};

Monster.order = null;
Monster.dashboard = function(sort, rev) {
	var i, j, o, type, monster, url, list = [], output = [], sorttype = [null, 'name', 'health', 'defense', null, 'timer', 'eta'], state = {
		engage:0,
		assist:1,
		reward:2,
		complete:3
	}, blank, image_url;
	if (typeof sort === 'undefined') {
		this.order = [];
		for (mid in this.data) {
			this.order.push(mid);
		}
	}
	if (typeof sort === 'undefined') {
		sort = (this.runtime.sort || 1);
	}
	if (typeof rev === 'undefined'){
		rev = (this.runtime.rev || false);
	}
	this.runtime.sort = sort;
	this.runtime.rev = rev;
	this.order.sort(function(a,b) {
		var aa, bb;
		if (state[Monster.data[a].state] > state[Monster.data[b].state]) {
			return 1;
		}
		if (state[Monster.data[a].state] < state[Monster.data[b].state]) {
			return -1;
		}
		if (typeof sorttype[sort] === 'string') {
			aa = Monster.data[a][sorttype[sort]];
			bb = Monster.data[b][sorttype[sort]];
		} else if (sort === 4) { // damage
			//			aa = Monster.data[a].damage ? Monster.data[a].damage[userID] : 0;
			//			bb = Monster.data[b].damage ? Monster.data[b].damage[userID] : 0;
			if (Monster.data[a].damage && Monster.data[a].damage.user) {
				aa = sum(Monster.data[a].damage.user) / sum(Monster.data[a].damage);
			}
			if (Monster.data[b].damage && Monster.data[b].damage.user) {
				bb = sum(Monster.data[b].damage.user) / sum(Monster.data[b].damage);
			}
		}
		if (typeof aa === 'undefined') {
			return 1;
		} else if (typeof bb === 'undefined') {
			return -1;
		}
		if (typeof aa === 'string' || typeof bb === 'string') {
			return (rev ? (''+bb).localeCompare(aa) : (''+aa).localeCompare(bb));
		}
		return (rev ? (aa || 0) - (bb || 0) : (bb || 0) - (aa || 0));
	});
	th(output, '');
	th(output, 'User');
	th(output, 'Health', 'title="(estimated)"');
	th(output, 'Defense', 'title="Composite of Fortification or Dispel (0%...100%)."');
	//	th(output, 'Shield');
	th(output, 'Activity');
	th(output, 'Time Left');
	th(output, 'Kill In (ETD)', 'title="(estimated)"');
	th(output, '');
	list.push('<table cellspacing="0" style="width:100%"><thead><tr>' + output.join('') + '</tr></thead><tbody>');
	for (o=0; o<this.order.length; o++) {
		uid = this.order[o].replace(/_\d+/,'');
		monster = this.data[this.order[o]];
		type = this.types[monster.type];
		if (!type) {
			continue;
		}
		output = [];
		blank = !((monster.state === 'engage' || monster.state === 'assist') && monster.total);
		// http://apps.facebook.com/castle_age/battle_monster.php?user=00000&mpool=3
		// http://apps.facebook.com/castle_age/battle_monster.php?twt2=earth_1&user=00000&action=doObjective&mpool=3&lka=00000&ref=nf
		// http://apps.facebook.com/castle_age/raid.php?user=00000
		// http://apps.facebook.com/castle_age/raid.php?twt2=deathrune_adv&user=00000&action=doObjective&lka=00000&ref=nf
		if (Monster.option.assist_link && (monster.state === 'engage' || monster.state === 'assist')) {
			url = '?user=' + uid + '&action=doObjective' + (type.mpool ? '&mpool=' + type.mpool : '') + '&lka=' + uid + '&ref=nf';
		} else {
			url = '?user=' + uid + (type.mpool ? '&mpool=' + type.mpool : '');
		}
		td(output, '<a href="http://apps.facebook.com/castle_age/' + (type.raid ? 'raid.php' : 'battle_monster.php') + url + '"><img src="' + imagepath + type.list + '" style="width:72px;height:20px; position: relative; left: -8px; opacity:.7;" alt="' + type.name + '"><strong class="overlay">' + monster.state + '</strong></a>', 'title="' + type.name + ' | Achievement: ' + addCommas(type.achievement) + '"');
		image_url = imagepath + type.list;
		//debug(image_url);
		th(output, '<a class="golem-monster-ignore" name="'+this.order[o]+'" title="Toggle Active/Inactive"'+(monster.ignore ? ' style="text-decoration: line-through;"' : '')+'>'+monster.name+'</a>');
		td(output,
			blank
				? ''
				: monster.health === 100
					? '100%'
					: monster.health.round(1) + '%',
			blank
				? ''
				: 'title="' + addCommas(monster.total - sum(monster.damage)) + '"');
		title = (isNumber(monster.strength)
					? 'Max: '+((monster.strength).round(1))+'% '
					: '')
				+ (isNumber(monster.defense)
						? 'Attack Bonus: ' + (monster.defense.round(1) - 50)+'%'
						: '');
		td(output,
			blank
				? ''
				: isNumber(monster.defense)
					? (monster.defense.round(1))+'%'
					: '',
			(title 
				? 'title="' + title + '"'
				: '')
				);
		td(output,
			(blank || monster.state !== 'engage' || (typeof monster.damage.user === 'undefined'))
				? ''
				: ((sum(monster.damage.user)  + sum(monster.defend) > Math.min(monster.ach,monster.max) && Math.max(monster.ach,monster.max) > 0) ? '<span style="color: green;">' : '<span style="color: red;">') + addCommas(sum(monster.damage.user) + sum(monster.defend)) + '</span>',
			blank
				? ''
				: 'title="' + ( sum(monster.damage.user) / monster.total * 100).round(2) + '% from ' + (sum(monster.stamina)/5 || 'an unknown number of') + ' PAs"');
		td(output,
			blank
				? ''
				: monster.timer
					? '<span class="golem-timer">' + makeTimer((monster.finish - Date.now()) / 1000) + '</span>'
					: '?');
		td(output,
			blank
				? ''
				: '<span class="golem-timer">' + (monster.health === 100
					? makeTimer((monster.finish - Date.now()) / 1000)
					: makeTimer((monster.eta - Date.now()) / 1000)) + '</span>');
		th(output, '<a class="golem-monster-delete" name="'+this.order[o]+'" title="Delete this Monster from the dashboard">[x]</a>');
		tr(list, output.join(''));
	}
	list.push('</tbody></table>');
	$('#golem-dashboard-Monster').html(list.join(''));
	$('a.golem-monster-delete').live('click', function(event){
		var x = $(this).attr('name');
		Monster._unflush();
		delete Monster.data[x];
		Monster.dashboard();
		return false;
	});
	$('a.golem-monster-ignore').live('click', function(event){
		var x = $(this).attr('name');
		Monster._unflush();
		Monster.data[x].ignore = !Monster.data[x].ignore;
		Monster.dashboard();
		if (Page.page !== 'monster_monster_list'){
			Page.to('monster_monster_list');
		} else {
			Page.to('index');
		}
		return false;
	});
	if (typeof sort !== 'undefined') {
		$('#golem-dashboard-Monster thead th:eq('+sort+')').attr('name',(rev ? 'reverse' : 'sort')).append('&nbsp;' + (rev ? '&uarr;' : '&darr;'));
	}
};

Monster.conditions = function (type, conditions) {
		if (!conditions || conditions.toLowerCase().indexOf(':' + type) < 0) {
			return false;
		}
		var value = conditions.substring(conditions.indexOf(':' + type) + type.length + 1).replace(new RegExp(":.+"), ''), first, second;
		if (/k$/i.test(value) || /m$/i.test(value)) {
			first = /\d+k/i.test(value);
			second = /\d+m/i.test(value);
			value = parseInt(value, 10) * 1000 * (first + second * 1000);
		}
		return parseInt(value, 10);
};
/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.News **********
* Aggregate the news feed
*/
var News = new Worker('News');
News.data = null;
News.option = null;

News.defaults['castle_age'] = {
	pages:'index'
};

News.runtime = {
	last:0
};
/* war victory -
Victory! You were challenged to war by xyz
You defeated your enemy, taking 0 damage and dealing 10 damage to your rival. You gained 43 experience points and $1,150,000. You have won 12 War Points!
// war defeat -
You were challenged by xyz
You lost the war, taking 10 damage and losing $0. You have lost 4 War Points!
*/
News.parse = function(change) {
	if (change) {
		var xp = 0, bp = 0, wp = 0, win = 0, lose = 0, deaths = 0, cash = 0, i, list = [], user = {}, last_time = this.runtime.last;
		News.runtime.last = Date.now();
		$('#app'+APPID+'_battleUpdateBox .alertsContainer .alert_content').each(function(i,el) {
			var uid, txt = $(el).text().replace(/,/g, ''), title = $(el).prev().text(), days = title.regex(/([0-9]+) days/i), hours = title.regex(/([0-9]+) hours/i), minutes = title.regex(/([0-9]+) minutes/i), seconds = title.regex(/([0-9]+) seconds/i), time, my_xp = 0, my_bp = 0, my_wp = 0, my_cash = 0, result;
			time = Date.now() - ((((((((days || 0) * 24) + (hours || 0)) * 60) + (minutes || 59)) * 60) + (seconds || 59)) * 1000);
			if (txt.regex(/You were killed/i)) {
				deaths++;
			} else {
				uid = $('a:eq(0)', el).attr('href').regex(/user=([0-9]+)/i);
				user[uid] = user[uid] || {name:$('a:eq(0)', el).text(), win:0, lose:0};
				result = null;
				if (txt.regex(/Victory!/i)) {
					win++;
					user[uid].lose++;
					my_xp = txt.regex(/([0-9]+) experience/i);
					my_bp = txt.regex(/([0-9]+) Battle Points!/i);
					my_wp = txt.regex(/([0-9]+) War Points!/i);
					my_cash = txt.regex(/\$([0-9]+)/i);
					result = 'win';
				} else {
					lose++;
					user[uid].win++;
					my_xp = 0 - txt.regex(/([0-9]+) experience/i);
					my_bp = 0 - txt.regex(/([0-9]+) Battle Points!/i);
					my_wp = 0 - txt.regex(/([0-9]+) War Points!/i);
					my_cash = 0 - txt.regex(/\$([0-9]+)/i);
					result = 'loss';
				}
				if (time > last_time) {
//					debug('Add to History (+battle): exp = '+my_xp+', bp = '+my_bp+', wp = '+my_wp+', income = '+my_cash);
					time = Math.floor(time / 3600000);
					History.add([time, 'exp+battle'], my_xp);
					History.add([time, 'bp+battle'], my_bp);
					History.add([time, 'wp+battle'], my_wp);
					History.add([time, 'income+battle'], my_cash);
					switch (result) {
						case 'win':
							History.add([time, 'battle+win'], 1);
							break;
						case 'loss':
							History.add([time, 'battle+loss'], -1);
							break;
					}
				}
				xp += my_xp;
				bp += my_bp;
				wp += my_wp;
				cash += my_cash;
				
			}
		});
		if (win || lose) {
			list.push('You were challenged <strong>' + (win + lose) + '</strong> times, winning <strong>' + win + '</strong> and losing <strong>' + lose + '</strong>.');
			list.push('You ' + (xp >= 0 ? 'gained <span class="positive">' : 'lost <span class="negative">') + addCommas(Math.abs(xp)) + '</span> experience points.');
			list.push('You ' + (cash >= 0 ? 'gained <span class="positive">' : 'lost <span class="negative">') + '<b class="gold">$' + addCommas(Math.abs(cash)) + '</b></span>.');
			list.push('You ' + (bp >= 0 ? 'gained <span class="positive">' : 'lost <span class="negative">') + addCommas(Math.abs(bp)) + '</span> Battle Points.');
			list.push('You ' + (wp >= 0 ? 'gained <span class="positive">' : 'lost <span class="negative">') + addCommas(Math.abs(wp)) + '</span> War Points.');
			list.push('');
			user = sortObject(user, function(a,b){return (user[b].win + (user[b].lose / 100)) - (user[a].win + (user[a].lose / 100));});
			for (i in user) {
				list.push('<strong title="' + i + '">' + user[i].name + '</strong> ' + (user[i].win ? 'beat you <span class="negative">' + user[i].win + '</span> time' + (user[i].win>1?'s':'') : '') + (user[i].lose ? (user[i].win ? ' and ' : '') + 'was beaten <span class="positive">' + user[i].lose + '</span> time' + (user[i].lose>1?'s':'') : '') + '.');
			}
			if (deaths) {
				list.push('You died ' + (deaths>1 ? deaths+' times' : 'once') + '!');
			}
			$('#app'+APPID+'_battleUpdateBox  .alertsContainer').prepend('<div style="padding: 0pt 0pt 10px;"><div class="alert_title">Summary:</div><div class="alert_content">' + list.join('<br>') + '</div></div>');
		}
	}
	return true;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources, Window,
	Bank, Battle, Generals, LevelUp, Player:true,
	APP, APPID, log, debug, script_started, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Player **********
* Gets all current stats we can see
*/
var Player = new Worker('Player');

Player.settings = {
	keep:true
};

Player.defaults['castle_age'] = {
	pages:'*'
};

Player.runtime = {
	cash_timeout:null,
	energy_timeout:null,
	health_timeout:null,
	stamina_timeout:null
};

var use_average_level = false;

Player.init = function() {
	// Get the gold timer from within the page - should really remove the "official" one, and write a decent one, but we're about playing and not fixing...
	// gold_increase_ticker(1418, 6317, 3600, 174738470, 'gold', true);
	// function gold_increase_ticker(ticks_left, stat_current, tick_time, increase_value, first_call)
	var when = new Date(script_started + ($('*').html().regex(/gold_increase_ticker\(([0-9]+),/) * 1000));
	this.data.cash_time = when.getSeconds() + (when.getMinutes() * 60);
	this.runtime.cash_timeout = null;
	this.runtime.energy_timeout = null;
	this.runtime.health_timeout = null;
	this.runtime.stamina_timeout = null;
	Resources.add('Energy');
	Resources.add('Stamina');
	Resources.add('Gold');
};

Player.parse = function(change) {
	if (change) {
		return false;
	}
	if (!('#app'+APPID+'_main_bntp').length) {
		Page.reload();
		return;
	}
	var data = this.data, keep, stats, tmp;
	if ($('#app'+APPID+'_energy_current_value').length) {
		tmp = $('#app'+APPID+'_energy_current_value').parent().text().regex(/([0-9]+)\s*\/\s*([0-9]+)/);
		data.energy		= (tmp ? tmp[0] : 0);
//		data.maxenergy	= tmp[1] || 0;
		Resources.add('Energy', data.energy, true);
	}
	if ($('#app'+APPID+'_health_current_value').length) {
		tmp = $('#app'+APPID+'_health_current_value').parent().text().regex(/([0-9]+)\s*\/\s*([0-9]+)/);
		data.health		= (tmp ? tmp[0] : 0);
//		data.maxhealth	= tmp[1] || 0;
	}
	if ($('#app'+APPID+'_stamina_current_value').length) {
		tmp = $('#app'+APPID+'_stamina_current_value').parent().text().regex(/([0-9]+)\s*\/\s*([0-9]+)/);
		data.stamina	= (tmp ? tmp[0] : 0);
//		data.maxstamina	= tmp[1] || 0;
		Resources.add('Stamina', data.stamina, true);
	}
	if ($('#app'+APPID+'_st_2_5 strong:not([title])').length) {
		tmp = $('#app'+APPID+'_st_2_5').text().regex(/([0-9]+)\s*\/\s*([0-9]+)/);
		if (tmp) {
			data.exp		= tmp[0];
			data.maxexp		= tmp[1];
		}
	}
	data.cash		= parseInt($('strong#app'+APPID+'_gold_current_value').text().replace(/[^0-9]/g, ''), 10);
	data.level		= $('#app'+APPID+'_st_5').text().regex(/Level: ([0-9]+)!/i);
	data.armymax	= $('a[href*=army.php]', '#app'+APPID+'_main_bntp').text().regex(/([0-9]+)/);
	data.army		= Math.min(data.armymax, 501); // XXX Need to check what max army is!
	data.upgrade	= ($('a[href*=keep.php]', '#app'+APPID+'_main_bntp').text().regex(/([0-9]+)/) || 0);
	data.general	= $('div.general_name_div3').first().text().trim();
	data.imagepath	= $('#app'+APPID+'_globalContainer img:eq(0)').attr('src').pathpart();
	if (Page.page==='keep_stats') {
		keep = $('div.keep_attribute_section').first(); // Only when it's our own keep and not someone elses
		if (keep.length) {
			data.myname = $('div.keep_stat_title_inc > span', keep).text().regex(/"(.*)"/);
			data.rank = $('td.statsTMainback img[src*=rank_medals]').attr('src').filepart().regex(/([0-9]+)/);
			stats = $('div.attribute_stat_container', keep);
			data.maxenergy = $(stats).eq(0).text().regex(/([0-9]+)/);
			data.maxstamina = $(stats).eq(1).text().regex(/([0-9]+)/);
			data.attack = $(stats).eq(2).text().regex(/([0-9]+)/);
			data.defense = $(stats).eq(3).text().regex(/([0-9]+)/);
			data.maxhealth = $(stats).eq(4).text().regex(/([0-9]+)/);
			data.bank = parseInt($('td.statsTMainback b.money').text().replace(/[^0-9]/g,''), 10);
			stats = $('.statsTB table table:contains("Total Income")').text().replace(/[^0-9$]/g,'').regex(/([0-9]+)\$([0-9]+)\$([0-9]+)/);
			data.maxincome = stats[0];
			data.upkeep = stats[1];
			data.income = stats[2];
			Resources.add('Gold', data.bank + data.cash, true);
		}
	}
	if (Page.page==='town_land') {
		stats = $('.mContTMainback div:last-child');
		data.income = stats.eq(stats.length - 4).text().replace(/[^0-9]/g,'').regex(/([0-9]+)/);
	}
	$('span.result_body').each(function(i,el){
		var txt = $(el).text().replace(/,|\s+|\n/g, '');
		History.add('income', sum(txt.regex(/Gain.*\$([0-9]+).*Cost|stealsGold:\+\$([0-9]+)|Youreceived\$([0-9]+)|Yougained\$([0-9]+)/i)));
		if (txt.regex(/incomepaymentof\$([0-9]+)gold/i)){
			History.set('land', sum(txt.regex(/incomepaymentof\$([0-9]+)gold|backinthemine:Extra([0-9]+)Gold/i)));
		}
	});
	if ($('#app'+APPID+'_energy_time_value').length) {
		window.clearTimeout(this.runtime.energy_timeout);
		this.runtime.energy_timeout = window.setTimeout(function(){Player.get('energy');}, $('#app'+APPID+'_energy_time_value').text().parseTimer() * 1000);
	}
	if ($('#app'+APPID+'_health_time_value').length) {
		window.clearTimeout(this.runtime.health_timeout);
		this.runtime.health_timeout = window.setTimeout(function(){Player.get('health');}, $('#app'+APPID+'_health_time_value').text().parseTimer() * 1000);
	}
	if ($('#app'+APPID+'_stamina_time_value').length) {
		window.clearTimeout(this.runtime.stamina_timeout);
		this.runtime.stamina_timeout = window.setTimeout(function(){Player.get('stamina');}, $('#app'+APPID+'_stamina_time_value').text().parseTimer() * 1000);
	}
	$('strong#app'+APPID+'_gold_current_value').attr('title', 'Cash in Bank: $' + addCommas(data.bank));
	return false;
};

Player.update = function(type) {
	if (type !== 'option') {
		var i, j, types = ['stamina', 'energy', 'health'], list, step;
		for (j=0; j<types.length; j++) {
			list = [];
			step = Divisor(Player.data['max'+types[j]]);
			for (i=0; i<=Player.data['max'+types[j]]; i+=step) {
				list.push(i);
			}
			Config.set(types[j], list);
		}
		History.set('bank', this.data.bank);
		History.set('exp', this.data.exp);
	}
	Dashboard.status(this);
};

Player.get = function(what) {
	var data = this.data, when;
	switch(what) {
		case 'cash':			return (this.data.cash = parseInt($('strong#app'+APPID+'_gold_current_value').text().replace(/[^0-9]/g, ''), 10));
//		case 'cash_timer':		return $('#app'+APPID+'_gold_time_value').text().parseTimer();
		case 'cash_timer':		when = new Date();
								return (3600 + data.cash_time - (when.getSeconds() + (when.getMinutes() * 60))) % 3600;
		case 'energy':			return (this.data.energy = $('#app'+APPID+'_energy_current_value').parent().text().regex(/([0-9]+)\s*\/\s*[0-9]+/));
		case 'energy_timer':            return $('#app'+APPID+'_energy_time_value').text().parseTimer();
		case 'health':			return (this.data.health = $('#app'+APPID+'_health_current_value').parent().text().regex(/([0-9]+)\s*\/\s*[0-9]+/));
		case 'health_timer':            return $('#app'+APPID+'_health_time_value').text().parseTimer();
		case 'stamina':			return (this.data.stamina = $('#app'+APPID+'_stamina_current_value').parent().text().regex(/([0-9]+)\s*\/\s*[0-9]+/));
		case 'stamina_timer':           return $('#app'+APPID+'_stamina_time_value').text().parseTimer();
		case 'exp_needed':		return data.maxexp - data.exp;
		case 'pause':			return isWorker(Window) && !Window.active ? '(Disabled) ' : isWorker(Queue) && Queue.get('option.pause') ? '(Paused) ' : '';
		case 'bank':			return (data.bank - Bank.option.keep > 0) ? data.bank - Bank.option.keep : 0;
		default: return this._get(what);
	}
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Potions **********
* Automatically drinks potions
*/
var Potions = new Worker('Potions');

Potions.defaults['castle_age'] = {
	pages:'*'
};

Potions.option = {
	energy:35,
	stamina:35
};

Potions.runtime = {
	drink:false
};

Potions.display = [
	{
		id:'energy',
		label:'Maximum Energy Potions',
		select:{0:0,5:5,10:10,15:15,20:20,25:25,30:30,35:35,40:40,infinite:'&infin;'},
		help:'Will use them when you have to many, if you collect more than 40 they will be lost anyway'
	},{
		id:'stamina',
		label:'Maximum Stamina Potions',
		select:{0:0,5:5,10:10,15:15,20:20,25:25,30:30,35:35,40:40,infinite:'&infin;'},
		help:'Will use them when you have to many, if you collect more than 40 they will be lost anyway'
	}
];

Potions.parse = function(change) {
	// No need to parse out Income potions as about to visit the Keep anyway...
	$('.result_body:contains("You have acquired the Energy Potion!")').each(function(i,el){
		Potions.data['Energy'] = (Potions.data['Energy'] || 0) + 1;
	});
	if (Page.page === 'keep_stats') {
		this.data = {}; // Reset potion count completely at the keep
		$('.statsT2:eq(2) .statUnit').each(function(i,el){
			var info = $(el).text().replace(/\s+/g, ' ').trim().regex(/(.*) Potion x ([0-9]+)/i);
			if (info && info[0] && info[1]) {
				Potions.data[info[0]] = info[1];
			}
		});
	}
	return false;
};

Potions.update = function(type) {
	var i, txt = [], levelup = LevelUp.get('runtime.running');
	this.runtime.drink = false;
	if (Queue.enabled(this)) {
		for(i in this.data) {
			if (this.data[i]) {
				txt.push(makeImage('potion_'+i.toLowerCase()) + this.data[i] + '/' + this.option[i.toLowerCase()] + '<a class="golem-potion-drink" name="'+i+'" title="Drink one of this potion">' + ((this.runtime.type)?'[Don\'t Drink]':'[Drink]') + '</a>');
			}
			if (!levelup && typeof this.option[i.toLowerCase()] === 'number' && this.data[i] > this.option[i.toLowerCase()] && (Player.get(i.toLowerCase()) || 0) < (Player.get('max' + i.toLowerCase()) || 0)) {
				this.runtime.drink = true;
			}
		}
	}
        if (this.runtime.type){
            txt.push('Going to drink ' + this.runtime.amount + ' ' + this.runtime.type + ' potion.');
        }
	Dashboard.status(this, txt.join(', '));
        $('a.golem-potion-drink').live('click', function(event){
		var x = $(this).attr('name');
                var act = $(this).text().regex(/(.*)/);
		//debug('Clicked on ' + x);
                //debug('Action = ' + act);
                switch (act){
                    case '[Drink]':
                        //debug('Setting Runtime');
                        Potions.runtime.type = x;
                        Potions.runtime.amount = 1;
                        break;
                    default:
                        //debug('Clearing Runtime');
                        Potions.runtime.type = Potions.runtime.amount = null;
                }
                
                
	});
};

Potions.work = function(state) {
	if (!this.runtime.drink && !this.runtime.type) {
		return QUEUE_FINISH;
	}
	if (!state || !Page.to('keep_stats')) {
		return QUEUE_CONTINUE;
	}
	for(var i in this.data) {
		if (typeof this.option[i.toLowerCase()] === 'number' && this.data[i] > this.option[i.toLowerCase()]) {
			debug('Wanting to drink a ' + i + ' potion');
			Page.click('.statUnit:contains("' + i + '") form .imgButton input');
			break;
		}
	}
        if (this.runtime.type && this.runtime.amount){
                debug('Wanting to drink a ' + this.runtime.type + ' potion');
		Page.click('.statUnit:contains("' + this.runtime.type + '") form .imgButton input');
                this.runtime.type = this.runtime.amount = null;
        }
	return QUEUE_RELEASE;
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Alchemy, Bank, Battle, Generals, LevelUp, Monster, Player, Town,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Quest **********
* Completes quests with a choice of general
*/
// Should also look for quests_quest but that should never be used unless there's a new area
var Quest = new Worker('Quest');

Quest.defaults['castle_age'] = {
	pages:'quests_quest1 quests_quest2 quests_quest3 quests_quest4 quests_quest5 quests_quest6 quests_quest7 quests_quest8 quests_quest9 quests_demiquests quests_atlantis'
};

Quest.option = {
	general:true,
	general_choice:'any',
	what:'Influence',
	unique:true,
	monster:true,
	bank:true
};

Quest.runtime = {
	best:null,
	energy:0
};

Quest.land = ['Land of Fire', 'Land of Earth', 'Land of Mist', 'Land of Water', 'Demon Realm', 'Undead Realm', 'Underworld', 'Kingdom of Heaven', 'Ivory City'];
Quest.area = {quest:'Quests', demiquest:'Demi Quests', atlantis:'Atlantis'};
Quest.current = null;
Quest.display = [
	{
		id:'general',
		label:'Use Best General',
		checkbox:true
	},{
		advanced:true,
		id:'general_choice',
		label:'Use General',
		require:{'general':false},
		select:'generals'
	},{
		id:'what',
		label:'Quest for',
		select:'quest_reward',
		help:'Once you have unlocked all areas (Advancement) it will switch to Influence. Once you have 100% Influence it will switch to Experience. Cartigan will try to collect all items needed to summon Cartigan (via Alchemy), then will fall back to Advancement'
	},{
		id:'unique',
		label:'Get Unique Items First',
		checkbox:true
	},{
		id:'monster',
		label:'Fortify Monsters First',
		checkbox:true
	},{
		id:'bank',
		label:'Automatically Bank',
		checkbox:true
	}
];

Quest.init = function() {
	for (var i in this.data) {
		if (i.indexOf('\t') !== -1) { // Fix bad page loads...
			delete this.data[i];
		}
	}
	Resources.use('Energy');
};

Quest.parse = function(change) {
	if (change) {
		return false;
	}
	var quest = this.data, last_quest = null, area = null, land = null, i;
	if (Page.page === 'quests_quest') {
		return false; // This is if we're looking at a page we don't have access to yet...
	} else if (Page.page === 'quests_demiquests') {
		area = 'demiquest';
	} else if (Page.page === 'quests_atlantis') {
		area = 'atlantis';
	} else {
		area = 'quest';
		land = Page.page.regex(/quests_quest([0-9]+)/i) - 1;
	}
	for (i in quest) {
		if (quest[i].area === area && (area !== 'quest' || quest[i].land === land)) {
//			debug('Deleting ' + i + '(' + (Quest.land[quest[i].land] || quest[i].area) + ')');
			delete quest[i];
		}
	}
	if ($('div.quests_background,div.quests_background_sub').length !== $('div.quests_background .quest_progress,div.quests_background_sub .quest_sub_progress').length) {
		Page.to(Page.page, '');// Force a page reload as we're pretty sure it's a bad page load!
		return false;
	}
	$('div.quests_background,div.quests_background_sub,div.quests_background_special').each(function(i,el){
		var name, level, influence, reward, units, energy, tmp, type = 0;
		if ($(el).hasClass('quests_background_sub')) { // Subquest
			name = $('.quest_sub_title', el).text().trim();
			reward = $('.qd_2_sub', el).text().replace(/mil/g, '000000').replace(/[^0-9$]/g, '').regex(/^([0-9]+)\$([0-9]+)\$([0-9]+)$/);
			energy = $('.qd_3_sub', el).text().regex(/([0-9]+)/);
			level = $('.quest_sub_progress', el).text().regex(/LEVEL ([0-9]+)/i);
			influence = $('.quest_sub_progress', el).text().regex(/INFLUENCE: ([0-9]+)%/i);
			last_quest = null;
			type = 2;
		} else {
			name = $('.qd_1 b', el).text().trim();
			reward = $('.qd_2', el).text().replace(/[^0-9$]/g, '').regex(/^([0-9]+)\$([0-9]+)\$([0-9]+)$/);
			energy = $('.quest_req b', el).text().regex(/([0-9]+)/);
			if ($(el).hasClass('quests_background')) { // Main quest
				last_quest = name;
				level = $('.quest_progress', el).text().regex(/LEVEL ([0-9]+)/i);
				influence = $('.quest_progress', el).text().regex(/INFLUENCE: ([0-9]+)%/i);
				type = 1;
			} else { // Special / boss Quest
				type = 3;
			}
		}
		if (!name || name.indexOf('\t') !== -1) { // Hopefully stop it finding broken page load quests
			return;
		}
		quest[name] = {};
		quest[name].area = area;
		quest[name].type = type;
		quest[name].id = parseInt($('input[name="quest"]', el).val(), 10);
		if (last_quest) {
			quest[name].main = last_quest;
		}
		if (isNumber(land)) {
			quest[name].land = land;
		}
		if (isNumber(influence)) {
			quest[name].level = (level || 0);
			quest[name].influence = influence;
		}
		quest[name].exp = reward[0];
		quest[name].reward = (reward[1] + reward[2]) / 2;
		quest[name].energy = energy;
		if (type !== 2) { // That's everything for subquests
			if (type === 3) { // Special / boss quests create unique items
				quest[name].unique = true;
			}
			tmp = $('.qd_1 img', el).last();
			if (tmp.length && tmp.attr('title')) {
				quest[name].item	= tmp.attr('title').trim();
				quest[name].itemimg	= tmp.attr('src').filepart();
			}
			units = {};
			$('.quest_req >div >div >div', el).each(function(i,el){
				var title = $('img', el).attr('title');
				units[title] = $(el).text().regex(/([0-9]+)/);
			});
			if (length(units)) {
				quest[name].units = units;
			}
			tmp = $('.quest_act_gen img', el);
			if (tmp.length && tmp.attr('title')) {
				quest[name].general = tmp.attr('title');
			}
		}
	});
	this.data = sortObject(quest, function(a,b){return a > b;});// So they always appear in the same order
	return false;
};

Quest.update = function(type,worker) {
	if (worker === Town && type !== 'data') {
		return; // Missing quest requirements
	}
	// First let's update the Quest dropdown list(s)...
	var i, unit, own, need, noCanDo = false, best = null, best_advancement = null, best_influence = null, best_experience = null, best_land = 0, has_cartigan = false, list = [], items = {}, quests = this.data, maxenergy = Player.get('maxenergy',999);
	this._watch(Player);
	this._watch(Queue);
	if (!type || type === 'data') {
		for (i in quests) {
			if (quests[i].item && quests[i].type !== 3) {
				list.push(quests[i].item);
			}
			for (unit in quests[i].units) {
				items[unit] = Math.max(items[unit] || 0, quests[i].units[unit]);
			}
		}
		Config.set('quest_reward', ['Nothing', 'Cartigan', 'Advancement', 'Influence', 'Experience', 'Cash'].concat(unique(list).sort()));
		for (unit in items) {
			Resources.set(['_'+unit, 'quest'], items[unit]);
		}
	}
	// Now choose the next quest...
	if (this.option.unique) {
		for (i in quests) {
			if (quests[i].energy > maxenergy) {// Skip quests we can't afford
				continue;
			}
			if (quests[i].type === 3 && !Alchemy.get(['ingredients', quests[i].itemimg], 0) && (!best || quests[i].energy < quests[best].energy)) {
				best = i;
			}
		}
	}
	if (!best && this.option.what !== 'Nothing') {
		if (this.option.what === 'Cartigan' && (Generals.get('Cartigan', false) || (Alchemy.get(['ingredients', 'eq_underworld_sword.jpg'], 0) >= 3 && Alchemy.get(['ingredients', 'eq_underworld_amulet.jpg'], 0) >= 3 && Alchemy.get(['ingredients', 'eq_underworld_gauntlet.jpg'], 0) >= 3))) {
			// Sword of the Faithless x3 - The Long Path, Burning Gates
			// Crystal of Lament x3 - Fiery Awakening
			// Soul Eater x3 - Fire and Brimstone, Deathrune Castle
			has_cartigan = true; // Stop trying once we've got the general or the ingredients
		}
//		debug('option = ' + this.option.what);
//		best = (this.runtime.best && quests[this.runtime.best] && (quests[this.runtime.best].influence < 100) ? this.runtime.best : null);
		for (i in quests) {
			if (quests[i].energy > maxenergy) {// Skip quests we can't afford
				continue;
			}
			if (quests[i].units) {
				own = 0;
				need = 0;
				noCanDo = false;
				for (unit in quests[i].units) {
					own = Town.get([unit, 'own'], 0);
					need = quests[i].units[unit];
					if (need > own) {	// Need more than we own, skip this quest.
						noCanDo = true;	// set flag
						continue;	// no need to check more prerequisites.
					}
				}
				if (noCanDo) {
					continue;	// Skip to the next quest in the list
				}
			}
			switch(this.option.what) { // Automatically fallback on type - but without changing option
				case 'Cartigan': // Random Encounters in various Underworld Quests
					if (!has_cartigan && isNumber(quests[i].land)
					&& quests[i].land === 6
					&& (((i === 'The Long Path' || quests[i].main === 'The Long Path' || i === 'Burning Gates' || quests[i].main === 'Burning Gates') && Alchemy.get(['ingredients', 'eq_underworld_sword.jpg'], 0) < 3)
						|| ((i === 'Fiery Awakening' || quests[i].main === 'Fiery Awakening') && Alchemy.get(['ingredients', 'eq_underworld_amulet.jpg'], 0) < 3)
						|| ((i === 'Fire and Brimstone' || quests[i].main === 'Fire and Brimstone' || i === 'Deathrune Castle' || quests[i].main === 'Deathrune Castle') && Alchemy.get(['ingredients', 'eq_underworld_gauntlet.jpg'], 0) < 3))
					&& (!best || quests[i].energy < quests[best].energy)) {
						best = i;
					}// Deliberate fallthrough
				case 'Advancement': // Complete all required main / boss quests in an area to unlock the next one (type === 2 means subquest)
					if (isNumber(quests[i].land) && quests[i].land > best_land) { // No need to revisit old lands - leave them to Influence
						best_land = quests[i].land;
						best_advancement = null;
					}
					if (quests[i].type !== 2
					&& isNumber(quests[i].land)
					//&& quests[i].level === 1  // Need to check if necessary to do boss to unlock next land without requiring orb
					&& quests[i].land >= best_land
					&& ((isNumber(quests[i].influence) && quests[i].level <= 1 && quests[i].influence < 100) || (quests[i].type === 3 && !Alchemy.get(['ingredients', quests[i].itemimg], 0)))
					&& (!best_advancement || (quests[i].land === best_land && quests[i].energy < quests[best_advancement].energy))) {
						best_land = Math.max(best_land, quests[i].land);
						best_advancement = i;
					}// Deliberate fallthrough
				case 'Influence': // Find the cheapest energy cost quest with influence under 100%
					if (isNumber(quests[i].influence)
					&& quests[i].influence < 100
					&& (!best_influence || (quests[i].energy / quests[i].exp) < (quests[best_influence].energy / quests[best_influence].exp))) {
						best_influence = i;
					}// Deliberate fallthrough
				case 'Experience': // Find the best exp per energy quest
					if (!best_experience || (quests[i].energy / quests[i].exp) < (quests[best_experience].energy / quests[best_experience].exp)) {
						best_experience = i;
					}
					break;
				case 'Cash': // Find the best (average) cash per energy quest
					if (!best || (quests[i].energy / quests[i].reward) < (quests[best].energy / quests[best].reward)) {
						best = i;
					}
					break;
				default: // For everything else, there's (cheap energy) items...
					if (quests[i].item === this.option.what && (!best || quests[i].energy < quests[best].energy)) {
						best = i;
					}
					break;
			}
		}
		switch(this.option.what) { // Automatically fallback on type - but without changing option
			case 'Cartigan':	best = best || best_advancement || best_influence || best_experience;break;
			case 'Advancement':	best = best_advancement || best_influence || best_experience;break;
			case 'Influence':	best = best_influence || best_experience;break;
			case 'Experience':	best = best_experience;break;
			default:break;
		}
	}
	if (best !== this.runtime.best) {
		this.runtime.best = best;
		if (best) {
			this.runtime.energy = quests[best].energy;
			debug('Wanting to perform - ' + best + ' in ' + (isNumber(quests[best].land) ? this.land[quests[best].land] : this.area[quests[best].area]) + ' (energy: ' + quests[best].energy + ', experience: ' + quests[best].exp + ', gold: $' + shortNumber(quests[best].reward) + ')');
		}
	}
	if (best) {
		Dashboard.status(this, (isNumber(quests[best].land) ? this.land[quests[best].land] : this.area[quests[best].area]) + ': ' + best + ' (' + makeImage('energy') + quests[best].energy + ' = ' + makeImage('exp') + quests[best].exp + ' + ' + makeImage('gold') + '$' + shortNumber(quests[best].reward) + (quests[best].item ? Town.get([quests[best].item,'img'], null) ? ' + <img style="width:16px;height:16px;margin-bottom:-4px;" src="' + imagepath + Town.get([quests[best].item, 'img']) + '" title="' + quests[best].item + '">' : ' + ' + quests[best].item : '') + (isNumber(quests[best].influence) && quests[best].influence < 100 ? (' @ ' + makeImage('percent','Influence') + quests[best].influence + '%') : '') + ')');
	} else {
		Dashboard.status(this);
	}
};

Quest.work = function(state) {
	var mid, general = 'any', best = this.runtime.best;
	if (!best || this.runtime.energy > Queue.burn.energy) {
		if (state && this.option.bank) {
			return Bank.work(true);
		}
		return QUEUE_FINISH;
	}
	if (this.option.monster 
			&& (Monster.get('runtime.defend')
				|| Monster.get('runtime.check')
				|| (Monster.get('runtime.secondary')
					&& !LevelUp.get('runtime.running')
					&& Player.get('energy') < Player.get('maxenergy')))) {
		return QUEUE_FINISH;
	}
	if (!state) {
		return QUEUE_CONTINUE;
	}
	if (this.option.general) {
		if (this.data[best].general && isNumber(this.data[best].influence) && this.data[best].influence < 100) {
			general = this.data[best].general;
		} else {
			switch(this.option.what) {
				case 'Cartigan':
					general = Generals.best('item');
					if (general !== 'any') {
						break;
					}
					// Deliberate fallthrough
				case 'Influence':
				case 'Advancement':
				case 'Experience':
					general = Generals.best('under level 4');
					if (general === 'any' && isNumber(this.data[best].influence) && this.data[best].influence < 100) {
						general = 'influence';
					}
					break;
				case 'Cash':
					general = 'cash';
					break;
				default:
					general = 'item';
					break;
			}
		}
	} else {
		general = this.option.general_choice;
	}
	if (!Generals.to(general)) {
		return QUEUE_CONTINUE;
	}
	switch(this.data[best].area) {
		case 'quest':
			if (!Page.to('quests_quest' + (this.data[best].land + 1))) {
				return QUEUE_CONTINUE;
			}
			break;
		case 'demiquest':
			if (!Page.to('quests_demiquests')) {
				return QUEUE_CONTINUE;
			}
			break;
		case 'atlantis':
			if (!Page.to('quests_atlantis')) {
				return QUEUE_CONTINUE;
			}
			break;
		default:
			log('Can\'t get to quest area!');
			return QUEUE_FINISH;
	}
	debug('Performing - ' + best + ' (energy: ' + this.data[best].energy + ')');
	if (!Page.click($('input[name="quest"][value="' + this.data[best].id + '"]').siblings('.imgButton').children('input[type="image"]'))) { // Can't find the quest, so either a bad page load, or bad data - delete the quest and reload, which should force it to update ok...
		debug('Can\'t find button for ' + best + ', so deleting and re-visiting page...');
		delete this.data[best];
		Page.reload();
	}
	if (this.data[best].type === 3) {// Just completed a boss quest
		if (!Alchemy.get(['ingredients', this.data[best].itemimg], 0)) {// Add one as we've just gained it...
			Alchemy.set(['ingredients', this.data[best].itemimg], 1);
		}
		if (this.option.what === 'Advancement' && Page.pageNames['quests_quest' + (this.data[best].land + 2)]) {// If we just completed a boss quest, check for a new quest land.
			Page.to('quests_quest' + (this.data[best].land + 2));// Go visit the next land as we've just unlocked it...
		}
	}
	return QUEUE_RELEASE;
};

Quest.order = [];
Quest.dashboard = function(sort, rev) {
	var i, o, list = [], output = [];
	if (typeof sort === 'undefined') {
		this.order = [];
		for (i in this.data) {
			this.order.push(i);
		}
	}
	if (typeof sort === 'undefined') {
		sort = (this.runtime.sort || 1);
	}
	if (typeof rev === 'undefined'){
		rev = (this.runtime.rev || false);
	}
	this.runtime.sort = sort;
	this.runtime.rev = rev;
	function getValue(q){
		switch(sort) {
			case 0:	// general
				return Quest.data[q].general || 'zzz';
			case 1: // name
				return q;
			case 2: // area
				return isNumber(Quest.data[q].land) && typeof Quest.land[Quest.data[q].land] !== 'undefined' ? Quest.land[Quest.data[q].land] : Quest.area[Quest.data[q].area];
			case 3: // level
				return (isNumber(Quest.data[q].level) ? Quest.data[q].level : -1) * 100 + (Quest.data[q].influence || 0);
			case 4: // energy
				return Quest.data[q].energy;
			case 5: // exp
				return Quest.data[q].exp / Quest.data[q].energy;
			case 6: // reward
				return Quest.data[q].reward / Quest.data[q].energy;
			case 7: // item
				return Quest.data[q].item || 'zzz';
		}
		return 0; // unknown
	}
	this.order.sort(function(a,b) {
		var aa = getValue(a), bb = getValue(b);
		if (isString(aa) || isString(bb)) {
			return (rev ? (''+bb).localeCompare(aa) : (''+aa).localeCompare(bb));
		}
		return (rev ? (aa || 0) - (bb || 0) : (bb || 0) - (aa || 0));
	});
	th(output, 'General');
	th(output, 'Name');
	th(output, 'Area');
	th(output, 'Level');
	th(output, 'Energy');
	th(output, '@&nbsp;Exp');
	th(output, '@&nbsp;Reward');
	th(output, 'Item');
	list.push('<table cellspacing="0" style="width:100%"><thead><tr>' + output.join('') + '</tr></thead><tbody>');
	for (o=0; o<this.order.length; o++) {
		i = this.order[o];
		output = [];
		td(output, Generals.get([this.data[i].general]) ? '<img style="width:25px;height:25px;" src="' + imagepath + Generals.get([this.data[i].general, 'img']) + '" alt="' + this.data[i].general + '" title="' + this.data[i].general + '">' : '');
		th(output, i);
		td(output, isNumber(this.data[i].land) ? this.land[this.data[i].land].replace(' ','&nbsp;') : this.area[this.data[i].area].replace(' ','&nbsp;'));
		td(output, isNumber(this.data[i].level) ? this.data[i].level + '&nbsp;(' + this.data[i].influence + '%)' : '');
		td(output, this.data[i].energy);
		td(output, (this.data[i].exp / this.data[i].energy).round(2), 'title="' + this.data[i].exp + ' total, ' + (this.data[i].exp / this.data[i].energy * 12).round(2) + ' per hour"');
		td(output, '$' + addCommas((this.data[i].reward / this.data[i].energy).round()), 'title="$' + addCommas(this.data[i].reward) + ' total, $' + addCommas((this.data[i].reward / this.data[i].energy * 12).round()) + ' per hour"');
		td(output, this.data[i].itemimg ? '<img style="width:25px;height:25px;" src="' + imagepath + this.data[i].itemimg + '" alt="' + this.data[i].item + '" title="' + this.data[i].item + '">' : '');
		tr(list, output.join(''), 'style="height:25px;"');
	}
	list.push('</tbody></table>');
	$('#golem-dashboard-Quest').html(list.join(''));
	$('#golem-dashboard-Quest tbody tr td:nth-child(2)').css('text-align', 'left');
	if (typeof sort !== 'undefined') {
		$('#golem-dashboard-Quest thead th:eq('+sort+')').attr('name',(rev ? 'reverse' : 'sort')).append('&nbsp;' + (rev ? '&uarr;' : '&darr;'));
	}
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Bank, Battle, Generals, LevelUp, Player, Quest,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Town **********
* Sorts and auto-buys all town units (not property)
*/
var Town = new Worker('Town');
Town.data = {};

Town.defaults['castle_age'] = {
	pages:'town_soldiers town_blacksmith town_magic'
};

Town.option = {
	general:true,
	quest_buy:true,
	number:'None',
	maxcost:'$10m',
	units:'Best for Both',
	sell:false,
	upkeep:20
};

Town.runtime = {
	best_buy:null,
	best_sell:null,
	buy:0,
	sell:0,
	cost:0
};

Town.display = [
{
	id:'general',
	label:'Use Best General',
	checkbox:true
},{
	id:'quest_buy',
	label:'Buy Quest Items',
	checkbox:true
},{
	id:'number',
	label:'Buy Number',
	select:['None', 'Minimum', 'Army', 'Max Army'],
	help:'Minimum will only buy items need for quests if enabled. Army will buy up to your army size (modified by some generals), Max Army will buy up to 541 regardless of army size.'
},{
	id:'sell',
	require:{'number':[['None'],['Minimum']]},
	label:'Sell Surplus',
	checkbox:true,
	help:'Only keep the best items for selected sets.'
},{
	advanced:true,
	id:'units',
	require:{'number':[['None']]},
	label:'Set Type',
	select:['Best Offense', 'Best Defense', 'Best for Both'],
	help:'Select type of sets to keep. Best for Both will keep a Best Offense and a Best Defense set.'
},{
	advanced:true,
	id:'maxcost',
	require:{'number':[['None']]},
	label:'Maximum Item Cost',
	select:['$10k','$100k','$1m','$10m','$100m','$1b','$10b','$100b','$1t','$10t','$100t','INCR'],
	help:'Will buy best item based on Set Type with single item cost below selected value. INCR will start at $10k and work towards max buying at each level (WARNING, not cost effective!)'
},{
	advanced:true,
	require:{'number':[['None']]},
	id:'upkeep',
	label:'Max Upkeep',
	text:true,
	after:'%',
	help:'Enter maximum Total Upkeep in % of Total Income'
}
];

Town.blacksmith = {
	Weapon:	/avenger|axe|blade|bow|cleaver|cudgel|dagger|halberd|lance|mace|morningstar|rod|saber|spear|staff|stave|sword|talon|trident|wand|Crystal Rod|Daedalus|Dragonbane|Dreadnought Greatsword|Excalibur|Incarnation|Ironhart's Might|Lionheart Blade|Judgement|Justice|Lightbringer|Oathkeeper|Onslaught/i,
	Shield:	/buckler|shield|tome|Defender|Dragon Scale|Frost Dagger|Frost Tear Dagger|Harmony|Sword of Redemption|Terra's Guard|The Dreadnought/i,
	Helmet:	/cowl|crown|helm|horns|mask|veil|Lionheart Helm/i,
	Gloves:	/gauntlet|glove|hand|bracer|Slayer's Embrace/i,
	Armor:	/armor|chainmail|cloak|pauldrons|plate|raiments|robe|Blood Vestment|Garlans Battlegear|Faerie Wings|Swordsmans Plate/i,
	Amulet:	/amulet|bauble|charm|crystal|eye|heart|insignia|jewel|lantern|memento|orb|shard|soul|talisman|trinket|Paladin's Oath|Poseidons Horn| Ring|Ring of|Ruby Ore|Thawing Star/i
};

Town.init = function(){
	this._watch(Bank);
	Resources.use('Gold');
};

Town.parse = function(change) {
	if (!change) {
		var unit = Town.data, page = Page.page.substr(5);
		$('.eq_buy_row,.eq_buy_row2').each(function(a,el){
			// Fix for broken magic page!!
			if (!$('div.eq_buy_costs_int', el).length) {
				$('div.eq_buy_costs', el).prepend('<div class="eq_buy_costs_int"></div>').children('div.eq_buy_costs_int').append($('div.eq_buy_costs >[class!="eq_buy_costs_int"]', el));
			}
			if (!$('div.eq_buy_stats_int', el).length) {
				$('div.eq_buy_stats', el).prepend('<div class="eq_buy_stats_int"></div>').children('div.eq_buy_stats_int').append($('div.eq_buy_stats >[class!="eq_buy_stats_int"]', el));
			}
			if (!$('div.eq_buy_txt_int', el).length) {
				$('div.eq_buy_txt', el).prepend('<div class="eq_buy_txt_int"></div>').children('div.eq_buy_txt_int').append($('div.eq_buy_txt >[class!="eq_buy_txt_int"]', el));
			}
			var i, j, stats = $('div.eq_buy_stats', el), name = $('div.eq_buy_txt strong:first', el).text().trim(), costs = $('div.eq_buy_costs', el), cost = $('strong:first-child', costs).text().replace(/[^0-9]/g, ''),upkeep = $('div.eq_buy_txt_int:first',el).children('span.negative').text().replace(/[^0-9]/g, ''), match, maxlen = 0;
			unit[name] = unit[name] || {};
			unit[name].page = page;
			unit[name].img = $('div.eq_buy_image img', el).attr('src').filepart();
			unit[name].own = $(costs).text().regex(/Owned: ([0-9]+)/i);
			Resources.add('_'+name, unit[name].own, true);
			unit[name].att = $('div.eq_buy_stats_int div:eq(0)', stats).text().regex(/([0-9]+)\s*Attack/);
			unit[name].def = $('div.eq_buy_stats_int div:eq(1)', stats).text().regex(/([0-9]+)\s*Defense/);
			unit[name].tot_att = unit[name].att + (0.7 * unit[name].def);
			unit[name].tot_def = unit[name].def + (0.7 * unit[name].att);
			if (cost) {
				unit[name].cost = parseInt(cost, 10);
				if (upkeep){
					unit[name].upkeep = parseInt(upkeep, 10);
				}
				if (costs.text().indexOf('locked') === -1) {
					unit[name].buy = [];
					$('select[name="amount"]:first option', costs).each(function(i,el){
						unit[name].buy.push(parseInt($(el).val(), 10));
					});
				} else {
					delete unit[name].buy;
				}
				unit[name].sell = [];
				$('select[name="amount"]:last option', costs).each(function(i,el){
					unit[name].sell.push(parseInt($(el).val(), 10));
				});
			}
			if (page === 'blacksmith') {
				for (i in Town.blacksmith) {
					if ((match = name.match(Town.blacksmith[i]))) {
						for (j=0; j<match.length; j++) {
							if (match[j].length > maxlen) {
								unit[name].type = i;
								maxlen = match[j].length;
							}
						}
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
	att += getAttDef(data, function(list,i,units){if (units[i].page === 'magic'){list.push(i);}}, 'att', army, 'invade');
	def += getAttDef(data, null, 'def', army, 'invade');
	return {attack:att, defend:def};
};

Town.getDuel = function() {
	var att = 0, def = 0, data = this.data;
	att += getAttDef(data, function(list,i,units){if (units[i].type === 'Weapon'){list.push(i);}}, 'att', 1, 'duel');
	def += getAttDef(data, null, 'def', 1, 'duel');
	att += getAttDef(data, function(list,i,units){if (units[i].page === 'magic'){list.push(i);}}, 'att', 1, 'duel');
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
	var i, u, need, want, have, best_buy = null, best_sell = null, best_quest = false, buy = 0, sell = 0, data = this.data, quests, army = Math.min(Generals.get('runtime.armymax', 501), Player.get('armymax', 501)), max_buy = 0,
	incr = (this.runtime.cost_incr || 4);
        max_cost = ({
		'$10k':Math.pow(10,4),
		'$100k':Math.pow(10,5),
		'$1m':Math.pow(10,6),
		'$10m':Math.pow(10,7),
		'$100m':Math.pow(10,8),
		'$1b':Math.pow(10,9),
		'$10b':Math.pow(10,10),
		'$100b':Math.pow(10,11),
		'$1t':Math.pow(10,12),
		'$10t':Math.pow(10,13),
		'$100t':Math.pow(10,14),
                'INCR':Math.pow(10,incr)
	})[this.option.maxcost];
	switch (this.option.number) {
		case 'Army':
				max_buy = army;
				break;
		case 'Max Army':
				max_buy = Generals.get('runtime.armymax', army);
				break;
		default:
				max_buy = 0;
			break;
	}
	// These two fill in all the data we need for buying / sellings items
	this.runtime.invade = this.getInvade(army);
	this.runtime.duel = this.getDuel();
	// For all items / units
	// 1. parse through the list of buyable items of each type
	// 2. find the one with Resources.get(_item.invade_att) the highest (that's the number needed to hit 541 items in total)
	// 3. buy enough to get there
	// 4. profit (or something)...
	if (this.option.quest_buy || max_buy){
		for (u in data) {
			want = Resources.get(['_'+u, 'quest'], 0);
			need = this.option.quest_buy ? want : 0;
			have = data[u].own;
			// Sorry about the nested max/min/max -
			// Max - 'need' can't get smaller
			// Min - 'max_buy' is the most we want to buy
			// Max - needs to accounts for invade and duel
			if (this.option.units !== 'Best Defense') {
				need = Math.max(need, Math.min(max_buy, Math.max(Resources.get(['_'+u, 'invade_att'], 0), Resources.get(['_'+u, 'duel_att'], 0))));
			}
			if (this.option.units !== 'Best Offense') {
				need = Math.max(need, Math.min(max_buy, Math.max(Resources.get(['_'+u, 'invade_def'], 0), Resources.get(['_'+u, 'duel_def'], 0))));
			}
//			debug('Item: '+u+', need: '+need+', want: '+want);
			if (need > have) {// Want to buy more
				if (!best_quest && data[u].buy && data[u].buy.length) {
					if (data[u].cost <= max_cost && this.option.upkeep >= (((Player.get('upkeep') + (data[u].upkeep * bestValue(data[u].buy, need - have))) / Player.get('maxincome')) * 100) && (!best_buy || need > buy)) {
//						debug('Buy: '+need);
						best_buy = u;
						buy = need;
						if (this.option.quest_buy && want > have) {// If we're buying for a quest item then we're only going to buy that item first - though possibly more than specifically needed
							best_quest = true;
						}
					}
				}
			} else if (max_buy && this.option.sell && Math.max(need,want) < have && data[u].sell && data[u].sell.length) {// Want to sell off surplus (but never quest stuff)
				need = bestValue(data[u].sell, have - Math.max(need,want));
				if (need > 0 && (!best_sell || data[u].cost > data[best_sell].cost)) {
//					debug('Sell: '+need);
					best_sell = u;
					sell = need;
				}
			}
		}
	}

	this.runtime.best_buy = this.runtime.best_sell = null;
	this.runtime.buy = this.runtime.sell = this.runtime.cost = 0;
	if (best_sell) {// Sell before we buy
		this.runtime.best_sell = best_sell;
		this.runtime.sell = sell;
		this.runtime.cost = sell * data[best_sell].cost / 2;
		Dashboard.status(this, 'Selling ' + this.runtime.sell + ' &times; ' + best_sell + ' for ' + makeImage('gold') + '$' + shortNumber(this.runtime.cost));
	} else if (best_buy){
		this.runtime.best_buy = best_buy;
		this.runtime.buy = bestValue(data[best_buy].buy, buy - data[best_buy].own);
		this.runtime.cost = this.runtime.buy * data[best_buy].cost;
		if (Bank.worth(this.runtime.cost)) {
			Dashboard.status(this, 'Buying ' + this.runtime.buy + ' &times; ' + best_buy + ' for ' + makeImage('gold') + '$' + shortNumber(this.runtime.cost));
		} else {
			Dashboard.status(this, 'Waiting for ' + makeImage('gold') + '$' + shortNumber(this.runtime.cost - Bank.worth()) + ' to buy ' + this.runtime.buy + ' &times; ' + best_buy + ' for ' + makeImage('gold') + '$' + shortNumber(this.runtime.cost));
		}
	} else {
                if (this.option.maxcost === 'INCR'){
                    this.runtime.cost_incr = (incr === 14)? 4: incr + 1;
                    this.runtime.check = Date.now() + 3600000;
                } else {
                    this.runtime.cost_incr = null;
                    this.runtime.check = null;
                }
		Dashboard.status(this);
	}
};

Town.work = function(state) {
        var incr = (this.runtime.cost_incr || 4);
	if (this.runtime.best_sell){
		if (!state || !this.sell(this.runtime.best_sell, this.runtime.sell)) {
			return QUEUE_CONTINUE;
		}
	}
	if (this.runtime.best_buy){
		if (!state && !Bank.worth(this.runtime.cost)) {
                        if (this.runtime.check < Date.now() && this.option.maxcost === 'INCR'){
                                this.runtime.cost_incr = 4;
                                this.runtime.check = Date.now() + 3600000;
                        }                        
                        Dashboard.status(this, 'Waiting for ' + makeImage('gold') + '$' + shortNumber(this.runtime.cost - Bank.worth()) + ' to buy ' + this.runtime.buy + ' &times; ' + this.runtime.best_buy + ' for ' + makeImage('gold') + '$' + shortNumber(this.runtime.cost));
                        return QUEUE_FINISH;
		}
		if (!state || !this.buy(this.runtime.best_buy, this.runtime.buy)) {
			return QUEUE_CONTINUE;
		}
	}
	return QUEUE_FINISH;
};

Town.buy = function(item, number) { // number is absolute including already owned
	this._unflush();
	if (!this.data[item] || !this.data[item].buy || !this.data[item].buy.length || !Bank.worth(this.runtime.cost)) {
		return true; // We (pretend?) we own them
	}
	if (!Generals.to(this.option.general ? 'cost' : 'any') || !Bank.retrieve(this.runtime.cost) || !Page.to('town_'+this.data[item].page)) {
		return false;
	}
	var qty = bestValue(this.data[item].buy, number);
	$('.eq_buy_row,.eq_buy_row2').each(function(i,el){
		if ($('div.eq_buy_txt strong:first', el).text().trim() === item) {
				debug('Buying ' + qty + ' x ' + item + ' for $' + addCommas(qty * Town.data[item].cost));
				$('div.eq_buy_costs select[name="amount"]:eq(0)', el).val(qty);
				Page.click($('div.eq_buy_costs input[name="Buy"]', el));
		}
	});
        this.runtime.cost_incr = 4;
	return false;
};

Town.sell = function(item, number) { // number is absolute including already owned
	this._unflush();
	if (!this.data[item] || !this.data[item].sell || !this.data[item].sell.length) {
		return true;
	}
	if (!Page.to('town_'+this.data[item].page)) {
		return false;
	}
	var qty = bestValue(this.data[item].sell, number);
	$('.eq_buy_row,.eq_buy_row2').each(function(i,el){
		if ($('div.eq_buy_txt strong:first', el).text().trim() === item) {
				debug('Selling ' + qty + ' x ' + item + ' for $' + addCommas(qty * Town.data[item].cost / 2));
				$('div.eq_buy_costs select[name="amount"]:eq(1)', el).val(qty);
				Page.click($('div.eq_buy_costs input[name="Sell"]', el));
		}
	});
        this.runtime.cost_incr = 4;
	return false;
};

var makeTownDash = function(list, unitfunc, x, type, name, count) { // Find total att(ack) or def(ense) value from a list of objects (with .att and .def)
	var units = [], output = [], x2 = (x==='att'?'def':'att'), i, order = {
		Weapon:1,
		Shield:2,
		Helmet:3,
		Armor:4,
		Amulet:5,
		Gloves:6,
		Magic:7
	};
	if (name) {
		output.push('<div class="golem-panel"><h3 class="golem-panel-header" style="width:auto;">'+name+'</h3><div class="golem-panel-content">');
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
				output.push('<p><div style="height:25px;margin:1px;"><img src="' + imagepath + list[units[i]].img + '" style="width:25px;height:25px;float:left;margin-right:4px;"> ' + (list[units[i]].use ? list[units[i]].use[type+'_'+x]+' x ' : '') + units[i] + ' (' + list[units[i]].att + ' / ' + list[units[i]].def + ')' + (list[units[i]].cost?' $'+shortNumber(list[units[i]].cost):'') + '</div></p>');
		}
	}
	if (name) {
		output.push('</div></div>');
	}
	return output.join('');
};

Town.dashboard = function() {
	var left, right, generals = Generals.get(), best;
	best = Generals.best('duel');
	left = '<div style="float:left;width:50%;"><div class="golem-panel"><h3 class="golem-panel-header" style="width:auto;">Invade - Attack</h3><div class="golem-panel-content" style="padding:8px;">'
	+	makeTownDash(generals, function(list,i){list.push(i);}, 'att', 'invade', 'Heroes')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='soldiers' && units[i].use){list.push(i);}}, 'att', 'invade', 'Soldiers')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].use && units[i].type === 'Weapon'){list.push(i);}}, 'att', 'invade', 'Weapons')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='blacksmith' && units[i].use && units[i].type !== 'Weapon'){list.push(i);}}, 'att', 'invade', 'Equipment')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='magic' && units[i].use){list.push(i);}}, 'att', 'invade', 'Magic')
	+	'</div></div><div class="golem-panel"><h3 class="golem-panel-header" style="width:auto;">Duel - Attack</h3><div class="golem-panel-content" style="padding:8px;">'
	+	(best !== 'any' ? '<div style="height:25px;margin:1px;"><img src="' + imagepath + generals[best].img + '" style="width:25px;height:25px;float:left;margin-right:4px;">' + best + ' (' + generals[best].att + ' / ' + generals[best].def + ')</div>' : '')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='blacksmith' && units[i].use){list.push(i);}}, 'att', 'duel')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='magic' && units[i].use){list.push(i);}}, 'att', 'duel')
	+	'</div></div></div>';
	best = Generals.best('defend');
	right = '<div style="float:right;width:50%;"><div class="golem-panel"><h3 class="golem-panel-header" style="width:auto;">Invade - Defend</h3><div class="golem-panel-content" style="padding:8px;">'
	+	makeTownDash(generals, function(list,i){list.push(i);}, 'def', 'invade', 'Heroes')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='soldiers' && units[i].use){list.push(i);}}, 'def', 'invade', 'Soldiers')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].use && units[i].type === 'Weapon'){list.push(i);}}, 'def', 'invade', 'Weapons')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='blacksmith' && units[i].use && units[i].type !== 'Weapon'){list.push(i);}}, 'def', 'invade', 'Equipment')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='magic' && units[i].use){list.push(i);}}, 'def', 'invade', 'Magic')
	+	'</div></div><div class="golem-panel"><h3 class="golem-panel-header" style="width:auto;">Duel - Defend</h3><div class="golem-panel-content" style="padding:8px;">'
	+	(best !== 'any' ? '<div style="height:25px;margin:1px;"><img src="' + imagepath + generals[best].img + '" style="width:25px;height:25px;float:left;margin-right:4px;">' + best + ' (' + generals[best].att + ' / ' + generals[best].def + ')</div>' : '')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='blacksmith' && units[i].use){list.push(i);}}, 'def', 'duel')
	+	makeTownDash(this.data, function(list,i,units){if (units[i].page==='magic' && units[i].use){list.push(i);}}, 'def', 'duel')
	+	'</div></div></div>';

	$('#golem-dashboard-Town').html(left+right);
};

/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Army, Config, Dashboard, History, Page, Queue, Resources,
	Battle, Generals, LevelUp, Player,
	APP, APPID, log, debug, userID, imagepath, isRelease, version, revision, Workers, PREFIX, Images, window, isGreasemonkey,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	makeTimer, shortNumber, WorkerByName, WorkerById, Divisor, length, unique, deleteElement, sum, addCommas, findInArray, findInObject, objectIndex, sortObject, getAttDef, tr, th, td, isArray, isObject, isFunction, isNumber, isString, isWorker, plural, makeTime, ucfirst, ucwords,
	makeImage
*/
/********** Worker.Upgrade **********
* Spends upgrade points
*/
var Upgrade = new Worker('Upgrade');
Upgrade.data = null;

Upgrade.defaults['castle_age'] = {
	pages:'keep_stats'
};

Upgrade.option = {
	order:[]
};

Upgrade.runtime = {
	working:false,
	run:0
};

Upgrade.display = [
	{
		label:'Points will be allocated in this order, add multiple entries if wanted (ie, 3x Attack and 1x Defense would put &frac34; on Attack and &frac14; on Defense)'
	},{
		id:'order',
		multiple:['Energy', 'Stamina', 'Attack', 'Defense', 'Health']
	}
];

Upgrade.parse = function(change) {
	var result = $('div.results');
	if (this.runtime.working && result.length && result.text().match(/You just upgraded your/i)) {
		this.runtime.working = false;
		this.runtime.run++;
	}
	return false;
};

Upgrade.update = function(type, worker) {
	if (this.runtime.run >= this.option.order.length) {
		this.runtime.run = 0;
	}
};

Upgrade.work = function(state) {
	var points = Player.get('upgrade'), args;
	if (!this.option.order.length || !points || (this.option.order[this.runtime.run]==='Stamina' && points<2)) {
		return QUEUE_FINISH;
	}
	switch (this.option.order[this.runtime.run]) {
		case 'Energy':	args = 'energy_max';	break;
		case 'Stamina':	args = 'stamina_max';	break;
		case 'Attack':	args = 'attack';		break;
		case 'Defense':	args = 'defense';		break;
		case 'Health':	args = 'health_max';	break;
		default: this.runtime.run++; return QUEUE_RELEASE; // Should never happen
	}
	if (state) {
		this.runtime.working = true;
		Page.to('keep_stats', {upgrade:args}, false);
	}
	return QUEUE_RELEASE;
};

