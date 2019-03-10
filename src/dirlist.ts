export default (files: string[]) => {
    return `<!DOCTYPE html>
<html>
    <head>
    <base href="./" />
    </head>
    <body>
    <ul>
    <li><a href=".">.</a></li>
    <li><a href="./..">..</a></li>
    ${files.map(value => `<li><a href="./${value}">${value}</a></li>`).join('')}
    </ul>
    </body>
</html>    
`
}