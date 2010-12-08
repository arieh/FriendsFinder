$(document).ready(function(){
    FB.init({
        appId: '179793705379369'
      , status: true
      , cookie: true
      , xfbml: true
    });
    
    function initSearcher(){
       var msg = $('.msg');
       msg.empty();
       msg.append(
            $("<span>App is loading</span>")
            , $("<img src='preloader.gif' alt='' />")
       );
       
       var list = new FriendsList, search = new SearchBox(list,{target:$('#search-box')});
       
       search.addEvent('ready',function(){
            msg.empty();            
            msg.append($('<span>You can now start searching your friends using the text-box bellow</span>'));
       });
    }
    
    if (FB._userStatus !== 'connected'){
        $('.msg').append('You must be logged in for this app to work properly.');
        FB.Event.subscribe('auth.login',initSearcher);
    
    }else initSearcher();
});