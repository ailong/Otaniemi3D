'use strict';

describe('HeatMapCtrl:', function () {

  beforeEach(module('otaniemi3dApp'));

  var $controller, $rootScope, $scope, controller;

  beforeEach(inject(function(_$controller_, _$rootScope_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    controller = $controller('HeatMapCtrl', { $scope: $scope });
  }));

  it('Initialised controller should have some time frames' +
     'sensor types defined', function () {
    expect($scope.timeFrames.length).not.toBe(0);
    expect($scope.sensorTypes.length).not.toBe(0);
  });

  it('Initialised controller should default timeFrame and' +
     'sensorType', function () {
    expect($scope.timeFrame).not.toBe(null);
    expect($scope.sensorType).not.toBe(null);
  });

  it('Default floor should be 1', function () {
    expect($scope.floor).toBe(1);
  });

  it('Selecting time frame should set $scope.timeFrame', function () {
    $scope.selectTimeFrame($scope.timeFrames[3]);
    expect($scope.timeFrame).toBe($scope.timeFrames[3]);
  });

  it('Selecting sensor type should set $scope.sensorType', function () {
    $scope.selectSensorType($scope.sensorTypes[2]);
    expect($scope.sensorType).toBe($scope.sensorTypes[2]);
  });

});