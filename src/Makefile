build:  javascript/main.js

javascript/main.js:	typescript/*.ts
	tsc -p .

test:	build
	node javascript/main.js
    
publish:    build test
	node publish.js

clean:
	rm -f javascript/*.js

tags:	typescript/*.ts
	ctags typescript/*.ts
