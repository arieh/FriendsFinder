(function($){
/**
 * Mixin object to supply costum events functionality to classes
 */ 
var Events = this.Events = {
    events : {}
    /**
     * fires an event, calling all callback functions listening to is
     *
     * @param {String} name event name
     * @param {Array}  args   a list of paramaters to pass to the callback
     * @param {mixed} bing   an object to bing the callback
     *
     * @return this
     */
    , fireEvent : function(name,args,bind){
        if (!this.events[name]) return;
        $.each(this.events[name],function(){
            this.apply(bind,args || []);
        });
        
        return this;
    }
    
    /**
     * adds a callback function to listen for an event
     *
     * @param {String}     name event name
     * @param {Function} cb      a callback function for the event 
     * 
     * @return this
     */
    , addEvent : function(name,cb){
        
        if (!this.events[name]) this.events[name] = [cb];
        else this.events[name].push(cb);
        
        return this;
    }
    
    /**
     * removes a function from the event stack
     * 
     * @param {String}     name event name
     * @param {Function} func   a function to remove from the stack
     *
     * @return this
     */
    , removeEvent :function(name,func){
        var index = $.inArray(func,this.events[name]);
        if (index>-1) this.events[name].splice(index,1);
        return this;
    }
}

//method for escaping regular expressions
//taken from http://stackoverflow.com/questions/280793/case-insensitive-string-replacement-in-javascript
RegExp.escape = function(str) {
  var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g"); // .*+?|()[]{}\
  return str.replace(specials, "\\$&");
}

/**
 * This Class provides the friends searching functionality. It assumes the user is connected to the facebook system.
 */
var FriendsList = this.FriendsList = function FriendsList(){
    var $this = this;
    FB.Event.subscribe('auth.logout',function(){
        this.fetched = false;
    });
    this.getFriends();
}

FriendsList.prototype = {
    friends : {}
    , fetched : false
    
    /**
     * fetches the friends list using the facebook SDK
     */
    , getFriends : function(){
         if (FB._userStatus != 'connected'){
            this.fireEvent('error',[0,"User must be connected to facebook for this class to work properly!"]);
            this.fetched = false;
            return false;
        }
         
         var $this = this;
         
         FB.api('/me/friends' , function(res){
            $this.friends = res.data;
            $this.fetched = true;
            $this.fireEvent('fetched');
         });
    }
    
    /**
     * searchs the friends list for any user that contains a certain string
     *
     * @param {String} phrase a string to match
     *
     * @return {Array} a list of friends matching the search phrase
     */
    , search : function(phrase){
        if (!this.fetched) this.fireEvent('error',[1,"cannot search while user in logged out!"]);
        
        var search = new RegExp(RegExp.escape(phrase),'i')
            , match = [];
        $.each(this.friends,function(){
            if (search.test(this.name)) match.push(this);
        });
        
        return match;
    }
}

$.extend(FriendsList.prototype,Events);

/**
 * Creates a search box for searching facebook friends
 *
 * @param {FriendsList} list         a FriendsList instance
 * @param {Object}        options  a list of optional parameters for the class (see SearchBox.options)
 */
var SearchBox = this.SearchBox = function SearchBox(list,options){
    var $this = this;
    
    function addOnce(){
        $this.init();
        list.removeEvent('fetched',addOnce);
    }
    
    $.extend(this.options,options || {});
    
    this.list = list;
    if (!list.fetched){
         list.addEvent('fetched',addOnce);
    } else this.init();
};

SearchBox.prototype = {
    /*
     *  a list of optional parameters for the class:
     */
    options : {
        // what element do we want to inject the widget into?
        target :null
        
        //what is the minimum # of chars before we start searching?
        , minLength : 2
    }
    
    /**
     * Class initializer
     */
    , init : function(){
        this.results = [];
        this.current = -1;
        this.generateBox();
        this.attachEvents();
        if (this.options.target) $(this.options.target).append(this.box);
        this.fireEvent('ready');
    }
    
    /** 
     * searches the friends list and creates a list for it
     * 
     * @param {String} phrase a search phrase
     *
     * @return this
     */
    , search : function(phrase){
        if (!this.list.fetched) return;
        var results = this.list.search(phrase);
        
        this.fireEvent('complete',[results]);
        
        this.createList(results,phrase);
        return this;
    }
    
    /* creates the elements used by the class and also in charge of caching main interface elements */
    , generateBox : function(){
        this.box = $(
            "<div class='box'>"
                +"<header>"
                    +'<input type="text" id="" class="search" />'
                +"</header>"
                
                +"<ol class='results'></ol>"
            +"</div>"
       );
       
       this.input = $(this.box.find('.search')[0]);
       this.resultsBox = $(this.box.find('.results')[0]);
    }
    
    /* attaches the various events in charge of the widget's functionality */
    , attachEvents : function(){
        var $this = this;
        
        this.input.bind('keyup',function(e){
           var ch = String.fromCharCode(e.which);
           
           if (ch && !ch.match(/[\w\s]/)) return;
           if (this.value.length>=$this.options.minLength) $this.search(this.value);
        });
        
        /* Keyboard navigation */
        this.box.delegate('input','keydown',function(e){
            $this.navigate(e);
        });
        
        this.box.delegate('a','keydown',function(e){
            $this.navigate(e);
        });
        
        this.input.bind('focus',function(){
            $this.current = -1;
        });
        
        //in case an anchor wa focused using tab navigation
        this.box.delegate('a','focus',function(e){
              var index = $.inArray(this,$this.results);
              $this.current = index;
        });
    }
    
    /* keyboard navigation event handler */
     , navigate : function(e){
        switch (e.which){
            case 40: //down
                if (this.current < this.results.length - 1){
                    if (this.current <-1) this.current = -1;
                    
                    this.results[++this.current].focus();
                    return false;;
                }
            break;
            case 38: //up
                if (this.current <0) return false;
                
                if (this.current == 0){
                    this.input.focus();
                    this.current--;
                    return false;;
                }
                
                this.results[--this.current].focus();
            break;
            case 9: return; break; //ingnore tabs
            default: 
                this.input.focus();
                this.current = -1;
                this.search(this.input[0].value);
            break;
        }
     }
    
    /**
     * creats a friends list in the widget
     *
     * @param {Array} friends   an array of literal objects containing friend's name and id (should conform with the FB data structure)
     * @param {String} phrase  the search phrase that was used to create the list
     *
     * @return this
     */
    , createList : function(friends,phrase){
        var $this = this, search = new RegExp('('+RegExp.escape(phrase)+')','ig');
        
        this.results = [];
        this.current = -1;
        this.resultsBox.empty();
        
        $.each(friends,function(){
           var li = 
               $('<li>'
                    +'<a href="http://www.facebook.com/profile.php?id='+this.id+'" target="_blank"><img src="http://graph.facebook.com/'+this.id+'/picture" alt="'+this.name+'\'s photo" />'
                        +'<span>'+this.name.replace(search,"<em>$1</em>")+'</span>'
                    +'</a>'
               +'</li>');
           $this.results.push(li.find('a')[0]);
           $this.resultsBox.append(li);
        });
        
        return this;
    }
    
    , close : function(){
        this.box.remove();        
    }
    
};

$.extend(SearchBox.prototype,Events);


jQuery.fn.friendsFinder = function(el,min){
     var params = {target:el}
     if (min) params['minLength'] = min;
     
     var list = new FriendsList;
     var box = new SearchBox(list,params);
     jQuery.fn.friendsFinder.box = box;
     jQuery.fn.friendsFinder.list = list;
     
     box.addEvent('ready',function(){
        $.event.trigger('friendsFinder.ready');
     });
     
     box.addEvent('complete',function(res){
        $.event.trigger('friendsFinder.complete',[res]);
     });
     
     return box;
};

}).apply(this,[jQuery]);