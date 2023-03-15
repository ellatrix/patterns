const fs = require( 'fs' );

(async () => {
    const themesResponse = await fetch(
        'https://wordpress.org/patterns/wp-json/wp/v2/wporg-pattern?orderby=favorite_count&locale=en_US&_locale=user&per_page=100&page=2'
    );
    
    const data = await themesResponse.json();

    fs.writeFileSync( 'bypopularity-2.json', JSON.stringify( data ) );
})();
