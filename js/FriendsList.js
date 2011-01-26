(function($,undef){

/**
 * This Class provides the friends searching functionality. It assumes the user is connected to the facebook system.
 */
var FriendsList = this.FriendsList = function FriendsList(){
    var $this = this;
    FB.Event.subscribe('auth.logout',function(){
        $this.fetched = false;
    });
    this.getFriends();
};

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
};

$.extend(FriendsList.prototype,Events);


}).apply(this,[jQuery]);