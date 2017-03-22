(function () {
    'use strict';

    angular.module('GroupChatControllerModule', [])

        .controller('groupChatController', ['$scope', 'AuthService', '$state', '$http', '$stateParams', '$window',
            function ($scope, AuthService, $state, $http, $stateParams, $window) {

                $scope.title = "CollabAll - Group Chat";
                $scope.contactAuthor = AuthService.authenticatedUser().FirstName + " " + AuthService.authenticatedUser().LastName;
                $scope.userID = AuthService.authenticatedUser().ID;
                $scope.groupID = $stateParams.groupID;
                $scope.group = [];
                $scope.groupMembers = [];
                $scope.groupCards = [];
                $scope.stream = '';
                $scope.prevAction = '';
                $scope.deviceOrientation = {};
                $scope.deviceOrientation.alpha = '';
                $scope.deviceOrientation.beta = '';
                $scope.deviceOrientation.gamma = '';
                $scope.messages = [];
                $scope.currentCard = '';
                $scope.currentCommunicating = '';


                document.getElementById("overlayScreen").style.width = "100%";
                document.getElementById("overlayScreen").style.height = "100%";

                $http.get('services/group/get-group-members', {params: {GroupId: $scope.groupID}})
                    .then(function (response) {
                        $scope.groupMembers = response.data.users;
                        $scope.groupMembers.sort(compare);

                        $http.get('services/card/get-cards-for-group', {params: {GroupId: $scope.groupID}})
                            .then(function (response) {
                                $scope.groupCards = response.data.cards;

                                $http.get('services/group/get-group-by-id', {params: {GroupId: $scope.groupID}})
                                    .then(function (response) {
                                        $scope.group = response.data.group;
                                        document.getElementById("overlayScreen").style.width = "0%";
                                        document.getElementById("overlayScreen").style.height = "0%";
                                    });
                            });
                    });

/************************START: Button Handler Code************************/
                $scope.communicate = function () {
                    /*
                    var message = {
                        body: "is communicating!",
                        user: $scope.contactAuthor
                    };
                    $scope.messages.push(message);
                  >>>  $scope.currentCommunicating = $scope.contactAuthor;
                    $window.document.getElementById('messages').scrollTop = messages.scrollHeight;
                    */

                    var action = {
                        body: "Communicating!",
                        user:  $scope.contactAuthor,
                        groupID: $scope.groupID
                    };
                    emitAction(action);
                    appendChat(action);

                };

                $scope.newCard = function (cardID) {
                    var result = $scope.groupCards.find(function (d) {
                        return d.ID === cardID;
                    });

                    /*
                    var message = {
                        body: "new discussion card: " + result.Title,
                        user: "john"
                    };
                    $scope.messages.push(message);
                  >>>  $scope.currentCard = result.Title;
                    $window.document.getElementById('messages').scrollTop = messages.scrollHeight;
                    */

                    var action = {
                        body: "Discussing: " + result.Title,
                        user:  $scope.contactAuthor,
                        groupID: $scope.groupID
                    };
                    emitAction(action);
                    appendChat(action);

                };

                $scope.interject = function (id) {
                    var result = '';
                    switch (id) {
                        case '1':
                            result = 'Slow Down!';
                            break;
                        case '2':
                            result = 'Question!';
                            break;
                        case '3':
                            result = 'Repeat!';
                            break;
                        case '4':
                            result = 'Don\'t Understand!';
                            break;
                    }

                    /*
                    var message = {
                        body: "new discussion card: " + result,
                        user: $scope.contactAuthor
                    };
                    $scope.messages.push(message);
                    $window.document.getElementById('messages').scrollTop = messages.scrollHeight;
                    */

                    var action = {
                        body: "Interjection: " + result,
                        user:  $scope.contactAuthor,
                        groupID: $scope.groupID
                    };
                    emitAction(action);
                    appendChat(action);
                };

/************************END: Button Handler Code************************/
function appendChat(message)
{
    $scope.messages.push(message);
    $window.document.getElementById('messages').scrollTop = messages.scrollHeight

    if(message.body.includes("Discussing:")){
        $scope.currentCard = message.body;
    }

    if(message.body.includes("Communicating!")){
        $scope.currentCommunicating = message.user;
    }

    $scope.$apply();
}

/************************START: Socket Code************************/
                var socket = io.connect({query: $scope.userID});

                socket.on('connect', function (msg) {
                    socket.emit('join', $scope.userID);
                    console.log("client joining server");
                });

                socket.emit("subscribe", {group: $scope.groupID});

                socket.on("disconnect", function () {
                    console.log("client disconnected from server");
                });

                socket.on('interjection', function (data) {
                    console.log('Incoming interjection:', data);
                });

                socket.on('tilt', function (data) {
                    if (data.groupID == $scope.groupID) {
                        var message = {
                            body: data.body,
                            user: data.user
                        };
                        appendChat(message);
                    }
                });

                $scope.$on("$destroy", function() {
                    socket.emit("unsubscribe", { group: $scope.groupID });
                });

                function emitAction(action){
                    socket.emit("deviceTilt", {deviceOrientation: action});
                    $window.navigator.vibrate(200)
                }

                console.log(socket);
/************************END: Socket Code************************/

/************************START: Device Motion************************/

                if ($window.DeviceMotionEvent) {
                    $window.addEventListener("devicemotion", motion, true);
                }
                else {
                    alert("DeviceMotionEvent NOT supported");
                }

                if ($window.DeviceOrientationEvent) {
                    $window.addEventListener("deviceorientation", orientation, false);
                }
                else {
                    alert("DeviceOrientation NOT supported");
                }

                function motion(event) {
                    $scope.deviceMotion = "Accelerometer: "
                        + event.accelerationIncludingGravity.x + ", "
                        + event.accelerationIncludingGravity.y + ", "
                        + event.accelerationIncludingGravity.z
                    $scope.$apply();
                }

                function orientation(event) {
                    $scope.deviceOrientation.alpha = event.alpha;
                    $scope.deviceOrientation.beta = event.beta;
                    $scope.deviceOrientation.gamma = event.gamma;

                    if (event.beta > 90) {
                        $scope.deviceOrientation.beta = 90
                    }

                    if (event.beta < -90) {
                        $scope.deviceOrientation.beta = -90
                    }


                    $scope.deviceOrientation.beta += 90;
                    $scope.deviceOrientation.gamma += 90;

                    $scope.$apply();

                }

                var pos = '';
                setInterval(function () {
                    if ($state.current.name == 'inside.group-chat') {
                        if ($scope.deviceOrientation.beta >= 40 && $scope.deviceOrientation.beta <= 66)
                            pos = "Don't Understand!";
                        if ($scope.deviceOrientation.beta >= 150 && $scope.deviceOrientation.beta <= 170)
                            pos = "Slow Down!";
                        if ($scope.deviceOrientation.gamma >= 30 && $scope.deviceOrientation.gamma <= 80)
                            pos = "Question!";
                        if ($scope.deviceOrientation.gamma >= 115 && $scope.deviceOrientation.gamma <= 150)
                            pos = "Repeat!";

                        if (pos != '') {
                            if (pos != $scope.prevAction) {
                                $scope.prevAction = pos;
                                var action = {
                                    body: pos,
                                    user:  $scope.contactAuthor,
                                    groupID: $scope.groupID
                                };
;                              emitAction(action);
                            }
                        }
                    }

                }, 1000);
/************************END: Device Motion************************/

                function compare(a, b) {
                    if (a.FirstName < b.FirstName)
                        return -1;
                    if (a.FirstName > b.FirstName)
                        return 1;
                    return 0;
                }

            }]);


}());
