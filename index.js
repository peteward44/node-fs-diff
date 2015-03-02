/*jslint node: true */
'use strict';
// Small utility to analyse an input directory and check if any files have been changed since
// the last time it was looked at.

var fs = require('fs-extra')
	, crc = require('crc')
	, path = require('path')
	, extend = require('node.extend');


var includeFile = function( filePath, options ) {
	if ( !Array.isArray( options.fileExtensions ) ) {
		return true;
	}
	var fileExt = path.extname( filePath ).toLowerCase();
	return options.fileExtensions.indexOf( fileExt ) >= 0;
};


var calcHash = function( file ) {
	// Use hash for now as it's pretty quick
	return crc.crc32(fs.readFileSync(file)).toString(16);
};


var processDir = function( manifest, dir, absolutePath, changesReport, changesReportDir, options ) {
	// find corresponding dir entry if it exists, otherwise create one
	if ( !manifest.dirs ) {
		manifest.dirs = {};
	}
	if ( options.forceAddAll || !manifest.dirs.hasOwnProperty( dir ) ) {
		if ( !manifest.dirs.hasOwnProperty( dir ) ) {
			manifest.dirs[ dir ] = {};
		}
		
		var fullPath = absolutePath;
		if ( options.relativePath ) fullPath = path.relative(options.relativePath,fullPath);
		
		manifest.dirs[ dir ].fullPath = fullPath;
		// mark new directory
		if ( !changesReportDir.dirs ) {
			changesReportDir.dirs = {};
		}
		changesReportDir.dirs[ dir ] = {
			fullPath: fullPath,
			action: 'ADDED'
		};
		changesReport.dirs.added.push( fullPath );
		changesReport.totalChanges++;
		
		return true;
	} else {
		return false;
	}
};


var processFile = function( manifest, file, absolutePath, changesReport, changesReportDir, options ) {
	if ( !includeFile( absolutePath, options ) ) {
		return false;
	}
	if ( !manifest.files ) {
		manifest.files = {};
	}
	
	var fullPath = absolutePath;
	if ( options.relativePath ) fullPath = path.relative(options.relativePath,fullPath);
	
	var hash = calcHash( absolutePath );
	if ( options.forceAddAll || !manifest.files.hasOwnProperty( file ) ) {
		// mark as new file
		if ( !manifest.files.hasOwnProperty( file ) ) {
			manifest.files[ file ] = {};
		}
		
		
		
		manifest.files[ file ].fullPath = fullPath;
		manifest.files[ file ].hash = hash;
		if ( !changesReportDir.files ) {
			changesReportDir.files = {};
		}
		changesReportDir.files[ file ] = {
			fullPath: fullPath,
			hash: hash,
			action: 'ADDED'
		};
		changesReport.files.added.push( fullPath );
		changesReport.totalChanges++;
	} else {
		// check if file has been modified
		var image = manifest.files[ file ];
		if ( image.hash !== hash ) {
			// mark as modified
			if ( !changesReportDir.files ) {
				changesReportDir.files = {};
			}
			changesReportDir.files[ file ] = {
				fullPath: fullPath,
				hash: hash,
				oldHash: image.hash,
				action: 'MODIFIED'
			};
			changesReport.files.modified.push( fullPath );
			changesReport.totalChanges++;
			image.hash = hash;
		}
	}
};


var doRecurse = function( recurseDepth, dirJustAdded, options ) {
	if ( isFinite( options.maxRecurseDepth ) && options.maxRecurseDepth <= recurseDepth ) {
		return false;
	}
	if ( options.skipDirectoryContentsOnAddRemove && dirJustAdded ) {
		// if a directory has just been added or removed, don't report the contents in the change report, just the directory.
		return false;
	}
	return true;
};


var recurseDiskDir = function( recurseDepth, inputDir, manifest, changesReport, changesReportDir, options ) {
	var files = fs.readdirSync( inputDir );
	files.forEach( function( file ) {
		var absolutePath = path.join( inputDir, file );
		var stat = fs.statSync( absolutePath );
		if ( stat.isDirectory() ) {
			var addedDir = processDir( manifest, file, absolutePath, changesReport, changesReportDir, options );
			if ( doRecurse( recurseDepth, addedDir, options ) ) {
				recurseDiskDir( recurseDepth+1, absolutePath, manifest.dirs[ file ], changesReport, changesReportDir.dirs[ file ], options );
			}
		} else {
			processFile( manifest, file, absolutePath, changesReport, changesReportDir, options );
		}
	} );
};


var recurseManifestDir = function( recurseDepth, inputDir, manifest, changesReport, changesReportDir, options ) {

	for ( var file in manifest.files ) {
		if ( manifest.files.hasOwnProperty( file ) ) {
			var fileObj = manifest.files[ file ];
			var fullPath = fileObj.fullPath;
			
			var absolutePath = fullPath;
			if ( options.relativePath ) absolutePath = path.join(options.relativePath,absolutePath);
			
			if ( !fs.existsSync( absolutePath ) ) {
				if ( !changesReportDir.files ) {
					changesReportDir.files = {};
				}
				changesReportDir.files[ file ] = {
					fullPath: fullPath,
					oldHash: fileObj.hash,
					action: 'REMOVED'
				};
				changesReport.files.removed.push( fullPath );
				changesReport.totalChanges++;
				
				delete manifest.files[ file ];
			}
		}
	}
	
	for ( var dir in manifest.dirs ) {
		if ( manifest.dirs.hasOwnProperty( dir ) ) {
			var fullPath = manifest.dirs[ dir ].fullPath;
			
			var absolutePath = fullPath;
			if ( options.relativePath ) absolutePath = path.join(options.relativePath,fullPath);
			
			if ( !changesReportDir.dirs ) {
				changesReportDir.dirs = {};
			}
			var dirRemoved = false;
			if ( !fs.existsSync( absolutePath ) ) {
				changesReportDir.dirs[ dir ] = {
					fullPath: fullPath,
					action: 'REMOVED'
				};
				changesReport.dirs.removed.push( fullPath );
				changesReport.totalChanges++;
				dirRemoved = true;
			} else {
				// put empty entry for dir so subfiles can be reported
				changesReportDir.dirs[ dir ] = {
					fullPath: fullPath,
					action: 'NONE'
				};
			}
			if ( doRecurse( recurseDepth, dirRemoved, options ) ) {
				recurseManifestDir( recurseDepth+1, absolutePath, manifest.dirs[ dir ], changesReport, changesReportDir.dirs[ dir ], options );
			}
		}
	}
};


var removeEmptyDirectoryTrees = function( dirReport ) {

	var isEmpty = true;
	if ( dirReport.files && Object.keys( dirReport.files ).length > 0 ) {
		isEmpty = false; // files exist, not empty
	}
	if ( dirReport.dirs ) {
		for ( var dir in dirReport.dirs ) {
			if ( dirReport.dirs.hasOwnProperty( dir ) ) {
				var dirObj = dirReport.dirs[ dir ];
				if ( dirObj.action !== 'NONE' ) {
					isEmpty = false; // removed/added directory, not empty
				}
			}
		}
		
		for ( var dir in dirReport.dirs ) {
			if ( dirReport.dirs.hasOwnProperty( dir ) ) {
				var dirObj = dirReport.dirs[ dir ];
				if ( dirObj.action === 'NONE' ) {
					// check each directory, make sure they're all empty too
					if ( !removeEmptyDirectoryTrees( dirObj ) ) {
						isEmpty = false;
					} else {
						delete dirReport.dirs[ dir ];
					}
				}
			}
		}
	}
	return isEmpty;
};


var checkChanges = function( inputDir, manifest, options ) {
	options = options || {};
	// Pass copy of manifest object to be updated
	var modifiedManifest = extend(true, {}, manifest);
	var changesReport = { // object describing which files / directories have changed
		files: {
			added: [],
			modified: [],
			removed: []
		},
		dirs: {
			added: [],
			removed: []
		},
		totalChanges: 0,
		root: {}
	};
	// Go through existing manifest to check if any files or directories have been deleted.
	recurseManifestDir( 0, inputDir, modifiedManifest, changesReport, changesReport.root, options );
	// Lists on-disk files and directories to check for additions and modifications.
	recurseDiskDir( 0, inputDir, modifiedManifest, changesReport, changesReport.root, options );
	removeEmptyDirectoryTrees( changesReport.root );
	return {
		manifest: modifiedManifest,
		report: changesReport
	};
};


module.exports = checkChanges;



