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

const { parse, getBlockTypes, createBlock } = require( '@wordpress/blocks' );

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

        if ( block.innerBlocks && block.innerBlocks.length ) {
            block.innerBlocks = removeAttrs( block.innerBlocks );
        } else {
            delete block.innerBlocks;
        }
    }

    return blocks;
}

const whiteListedAttributes = new Set( [
    'align',
    'style',
    'content',
    'url',
    'alt',
    'caption',
    'layout',
] )

const examples = getBlockTypes()
    .filter( ( { category } ) => new Set( [ 'text', 'media', 'design' ] ).has( category ) )
    .map( ( { name, attributes } ) => {
        return {
            name,
            attributes: Object.keys( attributes ).filter( ( key ) => whiteListedAttributes.has( key ) ),
        };
    } );

const examplesYaml = stringify( examples ) + `
The style attribute can have the following properties:
    - color, which can have the following sub-properties:
        - text
        - background
        - gradient
    - typography, which can have the following sub-properties:
        - fontSize
        - lineHeight
        - fontFamily
        - letterSpacing
        - textTransform
`;

console.log( examplesYaml )

fs.writeFileSync( 'data-schema.yml', examplesYaml );
