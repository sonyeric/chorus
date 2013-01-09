chorus.views.TagBoxCollection = chorus.views.TagBox.extend({
    templateName: "tag_box_collection",
    constructorName: "TagBoxCollectionView",

    setup: function() {
        this.resetTagCache();
    },

    tags: function() {
        var tagsHash = _.map(this.tagNames(), function(tagName) {
           return {name: tagName};
        });

        return new chorus.collections.TaggingSet(tagsHash);
    },

    additionalContext: function() {
        return {
            tags: this.tags().models
        };
    },

    updateTags: function(e, data) {
        if(data.length > this.tagCache.length) {
            // add
            var added = _.last(data);
            this.collection.each(function(model) {
               model.editableTags.add(added);
            });
            this.resetTagCache();
        } else if(data.length < this.tagCache.length) {
            // remove
            var tagNames = _.pluck(data, "name");
            var missing = _.find(this.tagCache, function(tagName) {
               return !_.contains(tagNames, tagName);
            });
            this.collection.each(function(model) {
                var missingTag = model.editableTags.where({name: missing });
                model.editableTags.remove(missingTag);
            });
            this.resetTagCache();
        }
    },

    tagNames: function () {
        var tagNames = this.collection.map(function(model) {
            return model.editableTags.pluck("name");
        });
        return _.uniq(_.flatten(tagNames));
    },

    resetTagCache: function() {
        this.tagCache = this.tagNames();
    },

    finishLastTag: function() {
        var lastTagValid = true;
        var inputText = this.input.val().trim();
        if(inputText) {
            lastTagValid = this.validateTag(inputText);

            if(lastTagValid) {
                this.textext.tags().addTags([{name: inputText}]);
            }
        }
        return lastTagValid;
    }
});