import { Loader } from './Loader';
import { LoadingManager } from './LoadingManager';
import { Object3D } from './../core/Object3D';

/**
 * Class for loading a texture.
 * Unlike other loaders, this one emits events instead of using predefined callbacks. So if you're interested in getting notified when things happen, you need to add listeners to the object.
 */
export class OBJLoader extends Loader {

	constructor( manager?: LoadingManager );

	load(
		url: string,
		onLoad?: <ObjectType extends Object3D>( object: ObjectType ) => void,
		onProgress?: ( event: ProgressEvent ) => void,
		onError?: ( event: Error | ErrorEvent ) => void
	): void;

}
