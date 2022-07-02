var pdf = require('html-pdf');

var contenido = 
`

<html>

<head>
    <style>
        html,
        body {
            margin: 0;
            padding: 0;
        }

        .myDiv {
            text-align: center;
            /*
  border: 5px outset red;
  background-color: lightblue;
  */

        }

        .myDiv2 {
            text-align: center;
            width: 200px;

        }

        .navItem {
            display: inline-block;
            padding: 20px;
            background: #4800ff;
            color: #fff;
        }

        .table,
        .th,
        .td {
            border: 0px;
            border-collapse: collapse;
            margin-bottom: 0;
            margin-right: 0;
            margin-left: 0;
            margin: 0 auto;
        }

        .margen {
            margin-right: 50;
            margin-left: 50;
            margin-top: 60;
            margin-bottom: 60;

        }

        h1,
        h2 {
            margin-top: 0;
            margin-bottom: 0;
            margin-right: 200;
            margin-left: 200;
        }

        .subtable {
            text-align: left;


        }

        .subfil {
            border: 2px solid black;
            padding: 0px 10px;
        }

        .res {
            background-color: rgb(222, 232, 248);
        }
    </style>
</head>

<body>
    <div class="margen" style="text-align:center; ">
        <table class="table">
            <tr>
                <th></th>
                <th>
                    <h2>Venta de Materiales de Construccion</h2>
                    <h1>San Cristobal</h1>
                </th>
                <th>
                    <table class="subtable">
                        <tr>
                            <th class="subfil res">Cotizacion</th>
                            <th class="subfil">XX-X</th>
                        </tr>
                        <tr>
                            <th class="subfil res">Fecha</th>
                            <th class="subfil">02/07/2022</th>
                        </tr>
                    </table>
                </th>
            </tr>
        </table>
        <img src="file:///.//prueba.png" alt="Imagen de Parzibyte">
    </div>
</body>

</html>

`;

pdf.create(contenido).toFile('./salida.pdf', function(err, res) {
    if (err){
        console.log(err);
    } else {
        console.log(res);
    }
});