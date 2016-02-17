'use strict';

module.exports = {
    customDesign: {
        version: 20,
        views: {
            byVisualizerVersion: {
                map: function (doc) {
                    if (doc.$type !== 'entry') return;
                    emit(doc.$content.version);
                },
                reduce: '_count'
            },
            search: {
                map: function (doc) {
                    if (doc.$type !== 'entry') return;
                    function uniq(a) {
                        var temp = {};
                        for (var i = 0; i < a.length; i++)
                            temp[a[i]] = true;
                        var r = [];
                        for (var k in temp)
                            r.push(k);
                        return r;
                    }

                    var content = doc.$content;
                    for (var flavor in content.flavors) {
                        var toEmit = {
                            _id: doc._id,
                            _rev: doc._rev,
                            flavor: flavor,
                            flavors: content.flavors[flavor],
                            data: false,
                            view: false,
                            meta: content.meta
                        };
                        if (doc._attachments) {
                            toEmit.data = !!doc._attachments["data.json"];
                            toEmit.view = !!doc._attachments["view.json"];
                        }

                        var flavor = content.flavors[flavor];
                        var keywords = [];
                        for (var i = 0; i < flavor.length; i++) {
                            var words = flavor[i].split(' ');
                            for (var j = 0; j < words.length; j++) {
                                keywords.push(words[j].toLowerCase())
                            }
                        }

                        if (content.keywords && (content.keywords instanceof Array)) {
                            for (i = 0; i < content.keywords.length; i++) {
                                try {
                                    var kw = content.keywords[i].toString();
                                    keywords.push(kw);
                                } catch (e) {

                                }
                            }
                        }

                        if (content.keywords && (typeof content.keywords === 'string')) {
                            var kws = content.keywords.replace(/[\s;, ]+/g, ' ').split(' ');
                            for (i = 0; i < kws.length; i++) {
                                keywords.push(kws[i]);
                            }
                        }

                        keywords = uniq(keywords);

                        for (i = 0; i < keywords.length; i++) {
                            for (j = i + 1; j < keywords.length; j++) {
                                emit([keywords[i], keywords[j]], toEmit);
                                emit([keywords[j], keywords[i]], toEmit);
                            }
                        }
                    }
                }
            },
            searchOne: {
                map: function (doc) {
                    if (doc.$type !== 'entry') return;
                    function uniq(a) {
                        var temp = {};
                        for (var i = 0; i < a.length; i++)
                            temp[a[i]] = true;
                        var r = [];
                        for (var k in temp)
                            r.push(k);
                        return r;
                    }

                    var content = doc.$content;
                    for (var flavor in content.flavors) {
                        var toEmit = {
                            _id: doc._id,
                            _rev: doc._rev,
                            flavor: flavor,
                            flavors: content.flavors[flavor],
                            data: false,
                            view: false,
                            meta: content.meta
                        };
                        if (doc._attachments) {
                            toEmit.data = !!doc._attachments["data.json"];
                            toEmit.view = !!doc._attachments["view.json"];
                        }

                        var flavor = content.flavors[flavor];
                        var keywords = [];
                        for (var i = 0; i < flavor.length; i++) {
                            var words = flavor[i].split(' ');
                            for (var j = 0; j < words.length; j++) {
                                keywords.push(words[j].toLowerCase())
                            }
                        }
                        if (content.keywords && (content.keywords instanceof Array)) {
                            for (i = 0; i < content.keywords.length; i++) {
                                try {
                                    var kw = content.keywords[i].toString();
                                    keywords.push(kw);
                                } catch (e) {

                                }
                            }
                        }

                        if (content.keywords && (typeof content.keywords === 'string')) {
                            var kws = content.keywords.replace(/[\s;, ]+/g, ' ').split(' ');
                            for (i = 0; i < kws.length; i++) {
                                keywords.push(kws[i]);
                            }
                        }

                        keywords = uniq(keywords);

                        for (i = 0; i < keywords.length; i++) {
                            emit(keywords[i], toEmit);
                        }
                    }
                }
            },
            list: {
                map: function (doc) {
                    if (doc.$type !== 'entry') return;

                    for (var i in doc.$content.flavors) {
                        emit(doc.$owners[0], i);
                    }
                },
                reduce: function (key, values, rereduce) {

                    var intobj = {};

                    if (rereduce) {
                        for (var i = 0; i < values.length; i++) {
                            var intres = values[i];
                            for (var j = 0; j < intres.length; j++) {
                                intobj[intres[j]] = true;
                            }
                        }
                    } else {
                        for (var i = 0; i < values.length; i++) {
                            intobj[values[i]] = true;
                        }
                    }
                    var result = [];
                    for (var i in intobj) {
                        result.push(i);
                    }
                    return result;
                }
            },
            docs: {
                map: function (doc) {
                    if (doc.$type !== 'entry') return;
                    if (doc.$owners.indexOf('anonymousRead') === -1) return;

                    var content = doc.$content;
                    for (var flavor in content.flavors) {
                        var toEmit = {
                            _id: doc._id,
                            _rev: doc._rev,
                            version: content.version,
                            flavor: flavor,
                            flavors: content.flavors[flavor],
                            data: false,
                            view: false,
                            meta: content.meta,
                            title: content.title
                        };
                        if (doc._attachments) {
                            toEmit.data = !!doc._attachments["data.json"];
                            toEmit.view = !!doc._attachments["view.json"];
                        }
                        emit([flavor, doc.$owners[0]], toEmit);
                    }
                }
            }
        },
        lists: {
            sort: function (head, req) {

                function sorter(row1, row2) {
                    var flavors1 = row1.value.flavors;
                    var flavors2 = row2.value.flavors;
                    var l1 = flavors1.length;
                    var l2 = flavors2.length;
                    var l = Math.max(l1, l2);
                    var counter = Math.min(l1, l2);
                    for (var i = 0; i < l; i++) {
                        if (--counter === 0) {
                            if (l1 > l2) {
                                return -1;
                            }
                            if (l2 > l1) {
                                return 1;
                            }
                        }
                        var flavor1 = flavors1[i].toLowerCase();
                        var flavor2 = flavors2[i].toLowerCase();
                        if (flavor1 === flavor2) {
                            continue;
                        }
                        return mySort(flavor1.split(/[ .]/), flavor2.split(/[ .]/));
                    }
                    return 0;
                }

                function mySort(a, b, index) {
                    if (!index) {
                        index = 0;
                    }
                    var valueA = a[index];
                    var valueB = b[index];
                    if (!valueA) {
                        return -1;
                    }
                    if (!valueB) {
                        return 1;
                    }
                    var aIsNumber = !isNaN(valueA);
                    var bIsNumber = !isNaN(valueB);
                    if (aIsNumber) {
                        if (bIsNumber) {
                            if (valueA * 1 == valueB * 1) {
                                return mySort(a, b, ++index);
                            }
                            return valueA * 1 - valueB * 1;
                        } else {
                            return -1;
                        }
                    } else {
                        if (bIsNumber) {
                            return 1;
                        } else {
                            if (valueA > valueB) {
                                return 1;
                            }
                            if (valueA < valueB) {
                                return -1;
                            }
                            return mySort(a, b, ++index);
                        }
                    }

                }

                start({
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                var rows = [];
                var row;
                while (row = getRow()) {
                    rows.push(row);
                }

                rows.sort(sorter);

                send(JSON.stringify(rows));

            }


        },
        filters: {
            copyAdminToCheminfo: function(doc) {
                if (doc._id.substring(0, 7) === '_design') return true;
                if (doc.$type === 'entry' && doc.$owners[0] === 'admin@cheminfo.org' && doc.$owners.indexOf('anonymousRead') !== -1) {
                    return true;
                }
                return false;
            }
        }
    }
};

