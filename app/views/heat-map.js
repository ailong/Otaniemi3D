'use strict';

/**
 * @ngdoc function
 * @name otaniemi3dApp.controller:HeatMapCtrl
 * @description
 * Controls Heat Map view.
 */
angular.module('otaniemi3dApp').controller('HeatMapCtrl', function ($scope, floorplanStorage, $modal, $state) {
  var _this = this;

  this.floor = Number($state.params.floorNum);

  if (!this.floor) {
    $state.go('heat-map', { floorNum: 1 }, { notify: false });
    this.floor = 1;
  }

  this.searchString = '';
  this.floorplans = floorplanStorage.list;
  this.room = {};
  this.svgSupport = Modernizr.svg;
  this.isFloorplanLoaded = false;
  this.floorplan = this.floorplans[this.floor - 1];

  this.sensorTypes = [{ text: 'Temperature',
    name: 'temperature',
    icon: 'images/temperature.svg' }, { text: 'CO2',
    name: 'co2',
    icon: 'images/co2.svg' }, { text: 'Humidity',
    name: 'humidity',
    icon: 'images/humidity.svg' }, { text: 'Light',
    name: 'light',
    icon: 'images/light.svg' }, { text: 'Occupancy',
    name: 'pir',
    icon: 'images/pir.svg' }];

  var day = new Date(),
      week = new Date(),
      month = new Date(),
      year = new Date();

  day.setDate(day.getDate() - 1);
  week.setDate(week.getDate() - 7);
  month.setMonth(month.getMonth() - 1);
  year.setFullYear(year.getFullYear() - 1);

  this.timeFrames = [{ text: 'Current',
    icon: 'images/latest.svg',
    params: {} }, { text: 'Last Week',
    icon: 'images/week.svg',
    params: { begin: week.toISOString() } }, { text: 'Last Month',
    icon: 'images/month.svg',
    params: { begin: month.toISOString() } }, { text: 'Last Year',
    icon: 'images/year.svg',
    params: { begin: year.toISOString() } }, { text: 'Select range',
    //icon: 'images/time-range.svg',
    params: { begin: null, end: null } }];

  this.sensorType = this.sensorTypes[0];
  this.timeFrame = this.timeFrames[0];

  /**
  * @ngdoc function
  * @name selectSensorType
  * @methodOf otaniemi3dApp.controller:HeatMapCtrl
  * @description
  * Select current sensor type. Heat map is then colored by that
  * sensor's values.
  *
  * @param {Object} sensor Sensor object with following properties:
  *   - ** text ** - `{string}` - Text that is displayed on sensor selector.
  *   - ** name ** - `{string}` - Sensor's name.
  *   - ** icon ** - `{string}` - Url to sensor's icon.
  */
  this.selectSensorType = function (sensor) {
    _this.sensorType = sensor;
  };

  /**
  * @ngdoc function
  * @name selectTimeFrame
  * @methodOf otaniemi3dApp.controller:HeatMapCtrl
  * @description
  * Display average sensor values in that time frame.
  *
  * @param {Object} timeFrame Time frame object with following properties:
  *   - ** text ** - `{string}` - Text that is displayed on time frame selector.
  *   - ** params ** - `{Object}` - Object with properties:
  *     - `begin` - `{string}` [optional] - Begin date as an ISO string.
  *     - `end` - `{string}` [optional] - End date as an ISO string.
  *   - ** icon ** - `{string}` - Url to time frame's icon.
  */
  this.selectTimeFrame = function (timeFrame) {
    if (timeFrame.text === 'Select range') {
      _this.modalInstance = $modal.open({
        templateUrl: 'templates/select-range.html',
        controller: 'ModalCtrl',
        controllerAs: 'modal',
        resolve: {
          params: function params() {
            return {
              timeRange: { begin: null, end: null }
            };
          }
        }
      });

      _this.modalInstance.result.then(function (params) {
        var time = params.timeRange;

        if (time.begin && time.end) {
          timeFrame.params.begin = time.begin.toISOString();
          timeFrame.params.end = time.end.toISOString();
          _this.timeFrame = timeFrame;
        }
      });
    } else {
      _this.timeFrame = timeFrame;
    }
  };

  this.toggleFullscreen = function () {
    $scope.App.fullscreen = !$scope.App.fullscreen;
  };

  this.nextFloor = function () {
    $state.go('heat-map', { floorNum: _this.floor + 1 });
  };

  this.prevFloor = function () {
    $state.go('heat-map', { floorNum: _this.floor - 1 });
  };

  this.selectRoom = function (room) {
    _this.room = room;
    $scope.$broadcast('room-selected', room);
  };

  this.searchRoom = function (searchString) {
    var rooms = _this.floorplan.rooms;
    var roomString;

    if (searchString.name) {
      roomString = searchString.name;
    } else {
      roomString = searchString;
    }

    for (var i = 0; i < rooms.length; i++) {
      if (rooms[i].name.toLowerCase() === roomString.toLowerCase()) {
        return _this.selectRoom(rooms[i]);
      }
    }

    _this.selectRoom({});
  };

  this.resetZoom = function () {
    $scope.$broadcast('reset-zoom');
  };

  this.mobileModal = function () {
    _this.modalInstance = $modal.open({
      templateUrl: 'templates/sensor-options.html',
      controller: 'ModalCtrl',
      controllerAs: 'modal',
      resolve: {
        params: function params() {
          return {
            sensorTypes: this.sensorTypes,
            sensorType: this.sensorType,
            timeFrames: this.timeFrames,
            timeFrame: this.timeFrame,
            timeRange: { begin: null, end: null }
          };
        }
      }
    });

    _this.modalInstance.result.then(function (params) {
      var time = params.timeRange;

      if (time.begin && time.end) {
        var length = _this.timeFrames.length;
        var timeFrame = _this.timeFrames[length - 1];
        timeFrame.params.begin = time.begin.toISOString();
        timeFrame.params.end = time.end.toISOString();
        _this.timeFrame = timeFrame;
      } else {
        _this.timeFrame = params.timeFrame;
      }
      _this.sensorType = params.sensorType;
    });
  };

  $scope.$on('floorplan-loaded', function () {
    _this.isFloorplanLoaded = true;
  });

  $scope.$on('$destroy', function () {
    if (_this.modalInstance) {
      _this.modalInstance.dismiss();
    }
  });
});
