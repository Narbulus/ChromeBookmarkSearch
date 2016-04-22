/**
 * Created by spencer.
 */
var leafBookmarks = {};
updateBookmarks();

function findLeaves(tree, result) {
    if (tree.children) {
        for (var i = 0; i < tree.children.length; i++) {
            findLeaves(tree.children[i], result);
        }
    } else {
        result[tree.title] = tree;
    }
}

function updateBookmarks() {
    chrome.bookmarks.getTree(
        function (bookmarkNodes) {
            findLeaves(bookmarkNodes[0], leafBookmarks);
        }
    );
}

chrome.omnibox.setDefaultSuggestion({
    description: '<dim>Start typing a bookmark</dim>'
});

chrome.omnibox.onInputEntered.addListener(
    function(text) {
        // Get partial matches from bookmarks
        var results = getMatchingBookmarks(text);
        var match = false;
        var url;
        // Loop over each partial match
        results.forEach(function(entry) {
           if (!url) {
               url = leafBookmarks[entry.content].url;
           }
            // If we have an exact match, navigate to it
            if (!match && entry.content.toLowerCase() == text.toLowerCase()) {
               match = true;
               chrome.tabs.update({
                   url: leafBookmarks[entry.content].url
               });
           }
        });
        // No exact match found, use first bookmark
        if (!match && url) {
            chrome.tabs.update({
                url: url
            });
        }
    });

chrome.omnibox.onInputChanged.addListener(
    function(text, suggest) {
        updateBookmarks();
        var results = getMatchingBookmarks(text);
        var desc = '<match>' + results.length + '</match> matching bookmarks found';
        if (results.length == 1) {
            desc = results[0].description;
        }
        chrome.omnibox.setDefaultSuggestion({
            description: desc
        });
        if (results.length > 0 && suggest) {
            suggest(results);
        }
    });

function getMatchingBookmarks(text) {
    var results = [];
    for (var mark in leafBookmarks) {
        if (leafBookmarks.hasOwnProperty(mark)) {
            if ((text == "" || mark.toLowerCase().indexOf(text.toLowerCase()) == 0) && mark.length > 0) {
                var desc = '<match>' + mark + ': </match>';
                desc += '<url>' + leafBookmarks[mark].url + '</url>';
                results.push({
                    content: mark,
                    description: escapeURLCharacters(desc)
                });
            }
        }
    }
    return results;
}

function escapeURLCharacters(url) {
    // Escape url ampersands in xml format
    return url.split(/&(?!amp;)/).join('&amp;');
}