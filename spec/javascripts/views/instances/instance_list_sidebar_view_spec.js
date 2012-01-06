describe("chorus.views.InstanceListSidebar", function() {
    beforeEach(function() {
        this.view = new chorus.views.InstanceListSidebar();
        spyOn(this.view, "render").andCallThrough();
        fixtures.model = "Instance";
    });

    describe("render", function() {
        beforeEach(function() {
            this.view.render();
        });

        describe("when no instance is selected", function() {
            it("should not display instance information", function() {
                expect(this.view.$(".info")).not.toExist();
            });
        });
    });

    context("when an instance is selected", function() {
        beforeEach(function() {
            $('#jasmine_content').append(this.view.el);
            this.activityViewStub = stubView("OMG I'm the activity list")
            spyOn(chorus.views, 'ActivityList').andReturn(this.activityViewStub)

            this.instance = fixtures.instance({instanceProvider: "Greenplum", name : "Harry's House of Glamour"})
            spyOn(this.instance, 'fetch');
            spyOn(this.instance.accounts(), 'fetch');
            spyOn(this.instance.activities(), 'fetch');
            this.view.trigger("instance:selected", this.instance);
        });

        it("displays instance name", function() {
            expect(this.view.$(".instance_name").text()).toBe("Harry's House of Glamour");
        });

        it("displays instance type", function() {
            expect(this.view.$(".instance_type").text()).toBe("Greenplum");
        });

        it("renders ActivityList subview", function() {
            expect(this.view.$(".activity_list")).toBeVisible();
            expect(this.view.$(".activity_list").text()).toBe("OMG I'm the activity list")
        });

        it("populates the ActivityList with the activities", function() {
            expect(chorus.views.ActivityList.mostRecentCall.args[0].collection).toBe(this.instance.activities());
        });

        it("sets the ActivityList displayStyle to without_object", function() {
            expect(chorus.views.ActivityList.mostRecentCall.args[0].displayStyle).toBe('without_object');
        });

        it("fetches the activities", function() {
            expect(this.instance.activities().fetch).toHaveBeenCalled();
        });


        it("fetches the accounts for the instance", function() {
            expect(this.instance.accounts().fetch).toHaveBeenCalled();
        });

        it("fetches the details for the instance", function() {
            expect(this.instance.fetch).toHaveBeenCalled();
        });

        it("has a 'add a note' link", function() {
            expect(this.view.$("a[data-dialog=NotesNew]")).toExist();
            expect(this.view.$("a[data-dialog=NotesNew]").text()).toMatchTranslation("actions.add_note");
            expect(this.view.$("a[data-dialog=NotesNew]").data("workfileAttachments")).toBeFalsy();
        });

        context("when user is an admin or owner of the instance", function() {

            it("displays edit instance link when user is admin", function() {
                setLoggedInUser({ userName : "benjamin", admin: true});
                this.view.render();
                expect(this.view.$(".actions .edit_instance")).toExist();
            });

            it("displays edit instance link when user is owner", function() {
                setLoggedInUser({ userName : "benjamin", admin: false});
                this.instance.set({ownerId : "10000"});
                this.view.render();
                expect(this.view.$(".actions .edit_instance")).toExist();
            });
        });

        context("when user is not an admin or owner of the instance", function() {

            it("does not display edit instance link when user is neither admin nor owner", function() {
                setLoggedInUser({ userName : "benjamin", admin: false});
                this.instance.set({owner : "harry"});
                this.view.render();
                expect(this.view.$(".actions .edit_instance")).not.toExist();
            });

        });
        context("and the selected instance triggers a 'change' event", function() {
            beforeEach(function() {
                this.view.render.reset();
                this.view.resource.trigger("change")
            })

            it("re-renders", function() {
                expect(this.view.render).toHaveBeenCalled();
            })
        });

        context("when the fetched accounts triggers a 'reset' event", function() {
            beforeEach(function() {
                this.view.render.reset();
                this.instance.accounts().trigger('reset');
            });

            it("re-renders", function() {
                expect(this.view.render).toHaveBeenCalled();
            })
        });

        context("when activity is clicked", function() {
            beforeEach(function() {
                this.view.$(".tab_control li.configuration").click();
                expect(this.view.$(".activity_list")).not.toBeVisible();
                this.view.$(".tab_control li.activity").click();
            })

            it("shows activity", function() {
                expect(this.view.$(".activity_list")).toBeVisible();
                expect(this.view.$(".configuration_detail")).not.toBeVisible();
            })
        })

        context("when configuration is clicked", function() {
            beforeEach(function() {
                expect(this.view.$(".configuration_detail")).not.toBeVisible();
                this.view.$(".tab_control li.configuration").click();
            })

            it("shows configuration", function() {
                expect(this.view.$(".configuration_detail")).toBeVisible();
                expect(this.view.$(".activity_list")).not.toBeVisible();
            })

            describe("for existing greenplum instance", function() {
                beforeEach(function() {
                    this.view.model = fixtures.modelFor("fetch");
                    this.view.render();
                });

                context("and the instance has a shared account", function() {
                    beforeEach(function() {
                        this.view.model = fixtures.modelFor("fetchWithSharedAccount");
                        this.view.render();
                    });

                    it("includes the shared account information", function() {
                        expect(this.view.$(".configuration_detail").text().indexOf(t("instances.shared_account"))).not.toBe(-1);
                    });

                    it("has a link to edit the instance permissions", function() {
                        expect(this.view.$("a.dialog[data-dialog=InstancePermissions]")).toExist();
                    });
                });

                context("and the instance does not have a shared account", function() {
                    it("does not include the shared account information", function() {
                        expect(this.view.$(".configuration_detail").text().indexOf(t("instances.sidebar.shared_account"))).toBe(-1);
                    });
                });
            });

            describe("for a new greenplum instance", function() {
                beforeEach(function() {
                    this.view.model = this.view.model.set({ size: "1", port: null, host: null, sharedAccount: {} });
                    this.view.render();
                });

                it("includes greenplum db size information", function() {
                    expect(this.view.$(".configuration_detail").text().indexOf(t("instances.sidebar.size"))).not.toBe(-1);
                });

                it("does not include the port, host, or shared account information", function() {
                    expect(this.view.$(".configuration_detail").text().indexOf(t("instances.sidebar.host"))).toBe(-1);
                    expect(this.view.$(".configuration_detail").text().indexOf(t("instances.sidebar.port"))).toBe(-1);
                    expect(this.view.$(".configuration_detail").text().indexOf(t("instances.sidebar.shared_account"))).toBe(-1);
                });
            });
        })

        context("when the instance has a shared account", function() {
            beforeEach(function() {
                this.instance.set({
                    sharedAccount: { dbUserName: "polenta" }
                });
                this.view.trigger("instance:selected", this.instance);
            });

            it("does not show the 'edit credentials' link", function() {
                expect(this.view.$(".actions .edit_credentials")).not.toExist();
            });

            it("does not show the 'add credentials' link", function() {
                expect(this.view.$(".actions .add_credentials")).not.toExist();
            });
        });

        context("when the instance does not have a shared account", function() {
            context("when the current user is NOT an admin or owner of the instance", function() {
                context("when the user does not have an account for the instance", function() {
                    it("shows the 'no access' text and image", function() {
                        expect(this.view.$(".account_info img").attr("src")).toBe("/images/instances/no_access.png");
                        expect(this.view.$(".account_info").text().trim()).toMatchTranslation("instances.sidebar.no_access");
                    });

                    it("shows the add credentials link", function() {
                        expect(this.view.$(".actions .add_credentials")).toExist();
                        expect(this.view.$(".actions .add_credentials").data("dialog")).toBe("InstanceAccount");
                        expect(this.view.$(".actions .add_credentials").data("title")).toMatchTranslation("instances.account.add.title");
                        expect(this.view.$(".actions .add_credentials").text()).toMatchTranslation("instances.sidebar.add_credentials");
                    });

                    it("does not show the 'edit credentials' link", function() {
                        expect(this.view.$(".actions .edit_credentials")).not.toExist();
                    });

                    it("does not show the 'remove credentials' link", function() {
                        expect(this.view.$(".actions .remove_credentials")).not.toExist();
                    });
                });

                context("when the user has set up an account for the instance", function() {
                    beforeEach(function() {
                        var account = fixtures.instanceAccount();
                        spyOn(this.instance, 'accountForCurrentUser').andReturn(account);
                        this.view.trigger("instance:selected", this.instance);
                    });

                    it("shows the 'access' text and image", function() {
                        expect(this.view.$(".account_info img").attr("src")).toBe("/images/instances/access.png");
                        expect(this.view.$(".account_info").text().trim()).toMatchTranslation("instances.sidebar.access");
                    });

                    it("shows the 'remove credentials' link", function() {
                        expect(this.view.$(".actions .remove_credentials").text()).toMatchTranslation("instances.sidebar.remove_credentials");
                        expect(this.view.$(".actions .remove_credentials").data("alert")).toBe("InstanceAccountDelete");
                    });

                    it("shows the 'edit credentials' link", function() {
                        expect(this.view.$(".actions .edit_credentials")).toExist();
                        expect(this.view.$(".actions .edit_credentials").data("dialog")).toBe("InstanceAccount");
                        expect(this.view.$(".actions .edit_credentials").data("title")).toMatchTranslation("instances.account.edit.title");
                        expect(this.view.$(".actions .edit_credentials").text()).toMatchTranslation("instances.sidebar.edit_credentials");
                    });

                    it("does not show the 'add credentials' link", function() {
                        expect(this.view.$(".actions .add_credentials")).not.toExist();
                    });
                });
            });

            context("when the current user is an admin", function() {
                beforeEach(function() {
                    var account = fixtures.instanceAccount();
                    spyOn(this.instance, 'accountForCurrentUser').andReturn(account);
                    this.instance.accounts().add([fixtures.instanceAccount(), fixtures.instanceAccount()]);
                    setLoggedInUser({ userName : "benjamin", admin: true});
                    this.view.trigger("instance:selected", this.instance);
                });

                it("does not show the individual_account area", function() {
                    expect(this.view.$('.individual_account')).not.toBeVisible();
                });

                it("does not show the add/edit/remove credentials links", function() {
                    expect(this.view.$(".actions .remove_credentials")).not.toBeVisible();
                    expect(this.view.$(".actions .edit_credentials")).not.toBeVisible();
                    expect(this.view.$(".actions .add_credentials")).not.toBeVisible();
                });

                it("shows the edit_individual_accounts area", function() {
                    expect(this.view.$(".edit_individual_accounts")).toBeVisible();
                    expect(this.view.$(".edit_individual_accounts a[data-dialog=AdminInstancePermissions]")).toBeVisible();
                    expect(this.view.$(".individual_accounts_count").text()).toMatchTranslation('instances.sidebar.there_are_x_individual_accounts', {count: 2});
                });
            });

            context("when the current user is the owner", function() {
                beforeEach(function() {
                    setLoggedInUser({ userName : "benjamin", admin: true});
                });
            });
        });
    });
});
