(function($,undef){
    
/**
 * Mixin object to supply costum events functionality to classes
 */ 
var Events = this.Events = {
    /**
     * fires an event, calling all callback functions listening to is
     *
     * @param {String} name event name
     * @param {Array}  args   a list of paramaters to pass to the callback
     * @param {mixed} bing   an object to bing the callback
     *
     * @return this
     */
    fireEvent : function fireEvent(name,args,bind){
        if (!this.events) this.events = {};
        
        if (!this.events[name]) return this;
        
        $.each(this.events[name],function(){
            var $this = this;
            setTimeout(function(){$this.apply(bind,args || []);},0);
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
    , addEvent : function addEvent(name,cb){
        if (!this.events) this.events = {};        
        
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
    , removeEvent :function removeEvent(name,func){
        if (!this.events) this.events = {};
        
        if (!this.events[name]) return this;
        
        var index = $.inArray(func,this.events[name]);
        if (index>-1) this.events[name].splice(index,1);
        return this;
    }
}
    
}).apply(this,[jQuery]);