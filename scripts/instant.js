/**
 * DEFINE GLOBAL VARIABLES
 */
YDef = YAHOO.namespace;
YDom = YAHOO.util.Dom;
YEvent = YAHOO.util.Event;
Y$ = Sizzle;

function onLinkedInLoad() {
  IN.Event.on(
    IN
    , "auth"
    , function() {
      Instant().onAuth();
    }
  );
};


YDef("Instant");
Instant = (function() {
  var instance = null;
  
  function Singleton() {
    this.isLoggedIn = false;
    this.searcher = null;

    this.onAuth = function() {
      var searchInput = document.getElementById("search-input-field");
      searchInput.placeholder = "";
      //Set focus to field
      searchInput.focus();
      
      IN.API.Profile("me").result(
        function(profile) {
          showMsg(profile, true);
          initSearch();
        }
      ).error(
        function(profile) {
          showMsg(profile, false);
        }
      );
    };
    
    this.doLogout = function() {
      var searchInput = document.getElementById("search-input-field");
      searchInput.placeholder = "Login to experience INstant";
      searchInput.blur();
      
      this.isLoggedIn = false;
      YDom.removeClass(document.body, "loggedin");
      YDom.addClass(document.body, "guest");
      IN.User.logout();
    };

    function showMsg(profile, isSuccess) {
      var body = Y$("body")[0]
        , msgBox = Y$("#login .message")[0]
        , msg = "";
    
      if (isSuccess) {
        Instant().isLoggedIn = true;
        YDom.addClass(body, "loggedin");
        msg = "Welcome to INstant, <strong>"
          + profile.values[0].firstName
          + " "
          + profile.values[0].lastName
          + "</strong> [<a onclick='Instant().doLogout();' href='#'>Sign Out</a>]"
      } else {
        YDom.addClass(body, "faillogin");
        msg = "Sorry, an error has occured in logging in.  Please try again.";
      }
      msgBox.innerHTML = msg;
    };
    
    function initSearch() {
      var searchInput = document.getElementById("search-input-field")
        , searchResults = document.getElementById("search-results-list");
      
      Instant().searcher = new Instant.Searcher();
      
      YEvent.addListener(searchInput, "keyup", function(evt) {
        var target = YEvent.getTarget(evt)
          , keycode = evt.keyCode;
        if (isIgnoreKeyCode(keycode)) {
          return;
        }
        Instant().searcher.doSearch(target.value);
      });
      
      YEvent.addListener(searchResults, "click", handleClick);
    };
    
    function handleClick(evt) {
      var event = YEvent.getEvent(evt)
        , target = YEvent.getTarget(evt)
        , parent = YDom.getAncestorByClassName(target, "profile-result")
        , href = "";
       var myuser_id ;
      if (parent) {
        YDom.addClass(parent, "clicked");
     //   href = Y$("a", parent)[0].href;
		  myuser_id = Y$("input" , parent)[0].value;
	//   window.location.href = href;
      } else if (target.nodeName == "LI" && YDom.hasClass(target, "profile-result")) {
        YDom.addClass(target, "clicked");
		myuser_id = Y$("input" , target)[0].value;
     //   href = Y$("a", target)[0].href;
	//    window.location.href = href;
      }
	 
	  Instant().searcher.profileData(myuser_id);
	  Instant().searcher.resetResults();
    };
    
    //From YUI autocomplete
    function isIgnoreKeyCode(keycode) {
      if ((keycode == 9) || (keycode == 13)  || // tab, enter
        (keycode == 16) || (keycode == 17) || // shift, ctl
        (keycode >= 18 && keycode <= 20) || // alt, pause/break,caps lock
        (keycode == 27) || // esc
        (keycode >= 33 && keycode <= 35) || // page up,page down,end
        (keycode >= 36 && keycode <= 40) || // home,left,up, right, down
        (keycode >= 44 && keycode <= 45) || // print screen,insert
        (keycode == 229)) { 
        return true;
      } else {
        return false;
      }
    };
  };
  
  return function() {
    if (instance == null) {
      instance = new Singleton();
      
      instance.prototype = {
        getInstance: function() {
          if (instance == null) {
            instance = new Singleton();
            instance.constructor = null;
          }
          return instance;
        }
      };
      
      instance.constructor = null;
    }
    
    return instance;
  };
})();

YDef("Instant.Searcher");
Instant.Searcher = function () {
  var el = Y$("#search-results")[0]
    , searchActive = false
    , queuedSearch = null;
  
  this.doSearch = function (keyword) {
    if (!searchActive) {
      searchActive = true;
      _doSearch(keyword);
    } else {
      queuedSearch = keyword;
    }
  };
  
  
  this.profileData = function getProfileData(id) {
	
		_getProfileData(id);
	};
	
	this.resetResults = function resetResult(){
	   renderResults(''); 
	 
	};
	
	
	function _getProfileData(id) {
	
		if(id != ''){
		IN.API.Profile(id)
			.result(function(result) { 
				$("#divProfile").html('<script type="IN/FullMemberProfile" data-id="' +  result.values[0].id + '"><script>');
				IN.parse(document.getElementById("divProfile"));
			})
		}else{
			$("#divProfile").html('');
		}
	};
	
  
  function _doSearch(keyword) {
    IN.API.PeopleSearch().fields(
      "firstName"
      , "lastName"
      , "headline"
	  , "id"
      , "publicProfileUrl"
      , { "location" : ["name"] }
      , "pictureUrl"
      , "distance"
    ).params({
      "keywords": keyword,
      "facet": "network,F,S,A,O",
      "sort": "distance",
      "count": 15
    }).result(
      function(results) {
		_getProfileData('');
        renderResults(results);
      }
    );
  }
  
  
  
function renderResults(results) {
    var resultsContainer = document.getElementById("search-results-list")
      , totalResultsContainer = document.getElementById("total-results")
      , keyword = document.getElementById("search-input-field").value
      , resultsTemplate = TrimPath.parseDOMTemplate("search-result-template")
      , noResultsTemplate = TrimPath.parseDOMTemplate("no-search-results-template")
      , resultsHtml = "";
    
    totalResultsContainer.innerHTML = results.numResults ? results.numResults + " matches" : "";
   
    
    if (results != '' && results.people.values) {
      var currResult = null;
      for (var i=0, len=results.people.values.length; i<len; i++) {
        currResult = results.people.values[i];
		currResult.linkedInUserID = currResult.id ? currResult.id : "";
        currResult.pictureUrl = currResult.pictureUrl ? currResult.pictureUrl : "";
        currResult.publicProfileUrl = currResult.publicProfileUrl ? currResult.publicProfileUrl : "";
        currResult.headline = currResult.headline ? currResult.headline : "";
        resultsHtml += resultsTemplate.process(results.people.values[i]);
      }
    } 
    
    resultsContainer.innerHTML = resultsHtml;
    
    if (queuedSearch) {
      var temp = queuedSearch;
      queuedSearch = null;
      _doSearch(temp);
    } else {
      searchActive = false;
    }
  };
  

};