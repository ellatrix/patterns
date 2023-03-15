const { JSDOM } = require( 'jsdom' );
const fs = require( 'fs' )

const dom = new JSDOM( '<!doctype html><html><body></body></html>' );

global.window = dom.window
global.document = dom.window.document
global.navigator = {
    userAgent: 'node.js'
}
global.attachEvent = () => {}
global.MutationObserver = class {
    constructor( callback ) {}
    disconnect() {}
    observe( element, initObject ) {}
}
global.window.matchMedia = () => {
    return {
        addEventListener: () => {},
    };
}

const { registerCoreBlocks } = require( '@wordpress/block-library' );

registerCoreBlocks();

const { parse, getBlockTypes, getBlockType, createBlock } = require( '@wordpress/blocks' );

const file = require( './bypopularity.json' );
const file2 = require( './bypopularity-2.json' );

const [ firstBlock ] = file;
const { stringify } = require( 'yaml' );

function removeAttrs( blocks ) {
    for ( const block of blocks ) {
        delete block.clientId;
        delete block.originalContent;
        delete block.isValid
        delete block.validationIssues

        const blockType = getBlockType( block.name );

        block.name = block.name.replace( 'core/', '' );

        if ( block.attributes && Object.keys( block.attributes ).length ) {
            for ( const [ key, value ] of Object.entries( block.attributes ) ) {
                if ( new Set( [ 'className', 'id '] ).has( key ) ) {
                    delete block.attributes[ key ];
                    continue;
                }

                if ( value === blockType.attributes[ key ]?.default || value?.length === 0 ) {
                    delete block.attributes[ key ];
                }
            }
        } else {
            delete block.attributes;
        }

        if ( block.innerBlocks && block.innerBlocks.length ) {
            block.innerBlocks = removeAttrs( block.innerBlocks );
        } else {
            delete block.innerBlocks;
        }
    }

    return blocks;
}

const examples = getBlockTypes()
    .filter( ( { example } ) => example?.attributes || example?.innerBlocks )
    .map( ( { name, title, description, example, } ) => {
        return {
            name,
            title,
            description,
            block: createBlock( name, example.attributes, example.innerBlocks ),
        }
    } )



const entries = [];

for ( const example of examples ) {
    const pattern = removeAttrs( [ example.block ] );
    fs.writeFileSync( `./patterns/${ example.name.replace('core/', '') }.json`, JSON.stringify( pattern, null, 4 ) );
    entries.push( JSON.stringify( {
        prompt: example.title + '. ' + example.description + '\n\n###\n\n',
        completion: ' ' + JSON.stringify( pattern ) + '###',
    } ) )
}

const toProcess = [ ...file, ...file2 ];

for ( const entry of toProcess ) {
    const pattern = removeAttrs( parse( entry.pattern_content ) );
    fs.writeFileSync( `./patterns/${ entry.id }.json`, JSON.stringify( pattern, null, 4 ) );
    entries.push( JSON.stringify( {
        prompt: entry.title.rendered + '. ' + entry.meta.wpop_description + '\n\n###\n\n',
        completion: ' ' + JSON.stringify( pattern ) + '###',
    } ) )
}

fs.writeFileSync( 'dataset.jsonl', entries.join( '\n' ) )

const tokensThousands = fs.readFileSync( './dataset_prepared.jsonl' ).toString().length / 4000;

console.log( {
    'davinci': tokensThousands * 0.03,
    'curie': tokensThousands * 0.003,
    'babbage': tokensThousands * 0.0006,
    'ada': tokensThousands * 0.0004,
} )
