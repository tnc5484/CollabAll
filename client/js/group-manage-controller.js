(function () {
    'use strict';

    angular.module('GroupManageControllerModule', [])

        .controller('groupManageController', ['$scope', 'AuthService', '$state', '$http',
            function ($scope, AuthService, $state, $http) {

                $scope.title = "CollabAll - Manage Group";
                $scope.contactAuthor = AuthService.authenticatedUser().FirstName + " " + AuthService.authenticatedUser().LastName;
                $scope.userID = AuthService.authenticatedUser().ID;
                $scope.myGroups = [];


                document.getElementById("overlayScreen").style.width = "100%";
                document.getElementById("overlayScreen").style.height = "100%";

                $http.get('services/group/get-my-groups', {params: {UserId: $scope.userID}})
                    .then(function (response) {
                        $scope.myGroups = response.data.groups;

                        document.getElementById("overlayScreen").style.width = "0%";
                        document.getElementById("overlayScreen").style.height = "0%";

                    });


            }]);


}());
