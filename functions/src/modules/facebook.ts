const {FB/*, FacebookApiException*/} = require('fb');

// FB.options({version: 'v2.4'});
// var FelixO = FB.extend({appId: 'foo_id', appSecret: 'secret'});

// FB.setAccessToken('access_token');

export const get = () => FB.api('4', 
(res:any) => {
    if(!res || res.error) {
     console.log(!res ? 'error occurred' : res.error);
     return;
    }
    console.log(res.id);
    console.log(res.name);
  });