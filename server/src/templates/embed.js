(function(ekho) {
    var _scripTagId = '{{SCRIPT_ID}}',
        _url = '{{URL}}',
        _divId = '{{DIV_ID}}',
        _rendered = '{{{RENDERED}}}',
        styleTag = document.createElement('link');

    styleTag.rel   = 'stylesheet';
    styleTag.type  = 'text/css';
    styleTag.href  = 'http://{{url}}/static/embed/style.css';
    styleTag.media = 'all';
    document.getElementsByTagName('head')[0].appendChild(styleTag);

    styleTag       = document.createElement('link');
    styleTag.rel   = 'stylesheet';
    styleTag.type  = 'text/css';
    styleTag.href  = 'http://{{url}}/static/css/cleanslate.css';
    styleTag.media = 'all';
    document.getElementsByTagName('head')[0].appendChild(styleTag);

    var div       = document.createElement('div');
    div.id        = _divId;
    div.innerHTML = _rendered;
    div.className = 'ekho-container cleanslate';

    scriptTag = document.getElementById(_scripTagId);
    scriptTag.parentNode.insertBefore(div, scriptTag);

})(this);
