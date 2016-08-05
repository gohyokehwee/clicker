function $_GET(key) {
    var value = window.location.search.match(new RegExp('[?&]' + key + '=([^&#]*)'));
    return value && value[1];
}
//var socketURL="http://localhost:8080";
var socketURL="http://avalon-gabrielwu84.rhcloud.com:8000";
