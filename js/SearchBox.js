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
    this.getFriends();
}

FriendsList.prototype = {
    friends : {}
    , fetched : false
    
    /**
     * fetches the friends list using the facebook SDK
     */
    , getFriends : function(){
         if (FB._userStatus != 'connected') throw "User must be connected to facebook for this class to work properly!";
         
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
    
    $.extend(this.options,options || {});
    
    this.list = list;
    if (!list.fetched){
        list.addEvent('fetched',function(){
            $this.init();
        });
    } else this.init();
};

SearchBox.prototype = {
    box : null
    , resutls : []
    , current : -1
    /*
        a list of optional parameters for the class:
     */
    , options : {
        // what element do we want to inject the widget into?
        target :null
        
        //what is the minimum # of chars before we start searching?
        , minLength : 2
    }
    
    , init : function(){
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
        var results = this.list.search(phrase);
        
        this.fireEvent('complete',[results]);
        
        this.createList(results,phrase);
        return this;
    }
    
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
    
    , attachEvents : function(){
        var $this = this;
        
        function navigate(){
            if ($this.input == this) console.log('aaa');
        }
        
        this.input.bind('keyup',function(e){
           var ch = String.fromCharCode(e.which);
           
           if (ch && !ch.match(/[\w\s]/)) return;
           if (this.value.length>=$this.options.minLength) $this.search(this.value);
        });
        
        this.box.delegate('input','keydown',navigate);
        this.box.delegate('a','keydown',navigate);
    }
    
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
    }
};

$.extend(SearchBox.prototype,Events);

}).apply(this,[jQuery]);