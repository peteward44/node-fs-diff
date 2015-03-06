/*global describe:false, it:false */

// Note: These tests require a functional Artifactory server to test against
'use strict';

var fsDiff = require('../');

var path = require('path');
var should = require('should');
var fs = require('fs');

var fixturesPath = path.join( __dirname, "fixtures" );

describe('node-fs-diff', function() {

	describe('missing files / directory checks', function() {
		it('will detect missing files', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingfiles", "1" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingfiles", "2" ), result1.manifest );

			result2.report.files.removed.length.should.equal( 2 );
			result2.report.totalChanges.should.equal( 2 );
			
			Object.keys(result2.manifest.files).length.should.equal(1);
			(typeof result2.manifest.dirs).should.equal('undefined');
			
			done();
		});

		it('will detect missing subdirectory files', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingfiles_subdir", "1" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingfiles_subdir", "2" ), result1.manifest );

			result2.report.files.removed.length.should.equal( 2 );
			result2.report.totalChanges.should.equal( 2 );
			
			(typeof result2.manifest.files).should.equal('undefined');
			Object.keys(result2.manifest.dirs).length.should.equal(1);
			Object.keys(result2.manifest.dirs['subdir'].files).length.should.equal(1);
			
			done();
		});
		
		it('will detect missing directories', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingdir", "1" ) );
			
			var result2 = fsDiff( path.join( fixturesPath, "missingdir", "2" ), result1.manifest );

			result2.report.dirs.removed.length.should.equal( 1 );
			result2.report.totalChanges.should.equal( 3 );
			
			Object.keys(result2.manifest.files).length.should.equal(1);
			Object.keys(result2.manifest.dirs).length.should.equal(0);
			
			done();
		});
		
		it('will detect missing directories (complete removal option)', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingdir", "1" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingdir", "2" ), result1.manifest, { skipDirectoryContentsOnAddRemove: true } );

			result2.report.dirs.removed.length.should.equal( 1 );
			result2.report.totalChanges.should.equal( 1 );
			
			Object.keys(result2.manifest.dirs).length.should.equal(0);
			Object.keys(result2.manifest.files).length.should.equal(1);
			
			
			done();
		});
			
		it('will detect mix of missing files and directories', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingmix", "1" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingmix", "2" ), result1.manifest );

			result2.report.files.removed.length.should.equal( 3 );
			result2.report.dirs.removed.length.should.equal( 1 );
			result2.report.totalChanges.should.equal( 4 );
			
			Object.keys(result2.manifest.files).length.should.equal(1);
			Object.keys(result2.manifest.dirs).length.should.equal(1);
			
			done();
		});
				
		it('will detect mix of missing files and directories (complete removal option)', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingmix", "1" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingmix", "2" ), result1.manifest, { skipDirectoryContentsOnAddRemove: true } );

			result2.report.files.removed.length.should.equal( 1 );
			result2.report.dirs.removed.length.should.equal( 1 );
			result2.report.totalChanges.should.equal( 2 );
			
			Object.keys(result2.manifest.files).length.should.equal(1);
			Object.keys(result2.manifest.dirs).length.should.equal(1);
			
			done();
		});
	});
	

	describe('adding files / directory checks', function() {
		it('will detect adding files', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingfiles", "2" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingfiles", "1" ), result1.manifest );

			result2.report.files.added.length.should.equal( 2 );
			result2.report.totalChanges.should.equal( 2 );
			
			Object.keys(result2.manifest.files).length.should.equal(3);
			(typeof result2.manifest.dirs).should.equal('undefined');
			
			done();
		});

		it('will detect adding subdirectory files', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingfiles_subdir", "2" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingfiles_subdir", "1" ), result1.manifest );

			result2.report.files.added.length.should.equal( 2 );
			result2.report.totalChanges.should.equal( 2 );
			
			(typeof result2.manifest.files).should.equal('undefined');
			Object.keys(result2.manifest.dirs).length.should.equal(1);
			Object.keys(result2.manifest.dirs['subdir'].files).length.should.equal(3);
			
			done();
		});
		
		it('will detect adding directories', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingdir", "2" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingdir", "1" ), result1.manifest );

			result2.report.dirs.added.length.should.equal( 1 );
			result2.report.totalChanges.should.equal( 3 );
			
			Object.keys(result2.manifest.files).length.should.equal(1);
			Object.keys(result2.manifest.dirs).length.should.equal(1);
			
			done();
		});
		
		it('will detect adding directories (complete adding option)', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingdir", "2" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingdir", "1" ), result1.manifest, { skipDirectoryContentsOnAddRemove: true } );

			result2.report.dirs.added.length.should.equal( 1 );
			result2.report.totalChanges.should.equal( 1 );
			
			Object.keys(result2.manifest.files).length.should.equal(1);
			Object.keys(result2.manifest.dirs).length.should.equal(1);
			
			done();
		});
			
		it('will detect mix of adding files and directories', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingmix", "2" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingmix", "1" ), result1.manifest );

			result2.report.files.added.length.should.equal( 3 );
			result2.report.dirs.added.length.should.equal( 1 );
			result2.report.totalChanges.should.equal( 4 );
			
			Object.keys(result2.manifest.files).length.should.equal(2);
			Object.keys(result2.manifest.dirs).length.should.equal(2);
			
			done();
		});
				
		it('will detect mix of adding files and directories (complete adding option)', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "missingmix", "2" ) );
			var result2 = fsDiff( path.join( fixturesPath, "missingmix", "1" ), result1.manifest, { skipDirectoryContentsOnAddRemove: true } );

			result2.report.files.added.length.should.equal( 1 );
			result2.report.dirs.added.length.should.equal( 1 );
			result2.report.totalChanges.should.equal( 2 );
			
			Object.keys(result2.manifest.files).length.should.equal(2);
			Object.keys(result2.manifest.dirs).length.should.equal(2);
			
			done();
		});
	});
	
	
	describe('modified files checks', function() {
		it('will detect modified files', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "modifiedfiles", "1" ) );
			var result2 = fsDiff( path.join( fixturesPath, "modifiedfiles", "2" ), result1.manifest );

			result2.report.files.modified.length.should.equal( 1 );
			result2.report.totalChanges.should.equal( 1 );
			
			Object.keys(result2.manifest.files).length.should.equal(1);
			(typeof result2.manifest.dirs).should.equal('undefined');
			
			done();
		});
	});
	
	
	describe('Added/missing/modified files check', function() {
		it('will detect mixed changes', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "mix", "1" ) );
			var result2 = fsDiff( path.join( fixturesPath, "mix", "2" ), result1.manifest );
			
			//fs.writeFileSync( "c:\\r1.txt", JSON.stringify( result2, null, '\t' ) );

			result2.report.dirs.added.length.should.equal( 1 );
			result2.report.dirs.removed.length.should.equal( 1 );
			result2.report.files.added.length.should.equal( 3 );
			result2.report.files.removed.length.should.equal( 3 );
			result2.report.files.modified.length.should.equal( 2 );
			
			result2.report.totalChanges.should.equal( 10 );
			
			Object.keys(result2.manifest.files).length.should.equal(2);
			Object.keys(result2.manifest.dirs).length.should.equal(2);
			
			done();
		});
		
		it('will detect mixed changes (complete adding option)', function(done) {
			var result1 = fsDiff( path.join( fixturesPath, "mix", "1" ) );
			var result2 = fsDiff( path.join( fixturesPath, "mix", "2" ), result1.manifest, { skipDirectoryContentsOnAddRemove: true } );

			result2.report.dirs.added.length.should.equal( 1 );
			result2.report.dirs.removed.length.should.equal( 1 );
			result2.report.files.added.length.should.equal( 1 );
			result2.report.files.removed.length.should.equal( 1 );
			result2.report.files.modified.length.should.equal( 2 );
			
			result2.report.totalChanges.should.equal( 6 );
			
			Object.keys(result2.manifest.files).length.should.equal(2);
			Object.keys(result2.manifest.dirs).length.should.equal(2);
			
			done();
		});
	});
});

