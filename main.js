let KeyManager = function(target,evts){
    let keymap = {};
    evts.split(/\s+/).map(evt=>{
        target.addEventListener(evt,function(e){
            if(e.key in keymap){
                keymap[e.key].map(cb=>cb(e));
            }
        });
    });
    this.add = function(str,cb){
        let keynames = str.trim().split(/\s+/);
        keynames.map(key=>{
            if(!(key in keymap))keymap[key] = [];
            keymap[key].push(cb);
        });
        return {
            remove: ()=>{
                keynames.map(key=>{
                    let cbs = keymap[key];
                    let idx = cbs.indexOf(cb);
                    if(idx === -1)return;
                    cbs.splice(idx,1);
                    if(cbs.length === 0){
                        delete keymap[key];
                    }
                });
            }
        };
    };
};

/*
1/2 < floor(mod(floor(y/17)*2^(-17*floor(x)-mod(floor(y),17)),2))

floor(mod(mul(floor(div(y,17)),2)^(-17*floor(x)-mod(floor(y),17)),2))

floor(y/17)*2^(-17*floor(x)-mod(floor(y),17))

BigFloat(1/2) < (y.div(17).floor().mul(2).pow(BigFloat(-17).mul(x.floor()).sub(y.floor().mod(17)))).mod(2).floor();
*/

/*
let floor = function(b){
    b = BigFloat(b);
    return BigFloat(b.int,0);
};
let add = function(a,b){
    a = BigFloat(a);
    b = BigFloat(b);
    let i = a.int+b.int;
    let f = a.frac+b.frac;
    let rem = Math.floor(f);
    i += BigInt(rem);
    f = f-rem;
};
let sub = function(a,b){
    a = BigFloat(a);
    b = BigFloat(b);
    let i = a.int-b.int;
    let f = a.frac-b.frac;
    let rem = Math.floor(f);
    i += BigInt(rem);
    f = f-rem;
};
let mul = function(a,b){
    a = BigFloat(a);
    b = BigFloat(b);
    let k = 
    let i = a.int*b.int;
    let f = a.frac*b.frac;
}*/


let BIGFLOAT = function(b,f){
    this.int = 0n;
    this.frac = 0;
    if(typeof b === "number"){
        let i = Math.floor(b);
        this.int = BigInt(i);
        this.frac = b-i;
    }else if(f){
        let i = Math.floor(f);
        this.int = BigInt(b)+BigInt(i);
        this.frac = f-i;
    }else if(b){
        this.int = BigInt(b);
    }
};

let BigFloat = function(b,f){
    if(b.constructor === BIGFLOAT){
        return b;
    }
    return new BIGFLOAT(b,f);
};

let add = function(a,b){
    //console.log(a,b);
    a = BigFloat(a);
    b = BigFloat(b);
    return BigFloat(a.int+b.int,a.frac+b.frac);
};

let modexp = function(n,m,p){
    if(n === 0n) return 0;
    if(m === 0n)return 1n;
    let r = n;
    let i = 2n;
    for(i; i <= m; i*=2n){
        r = (r*r)%p;
    }
    return (r*modexp(n,m-i/2n,p))%p;
};

let xor = function(a,b){
    return a?!b:b;
};


let ineq = function(x,y){//x,y are bigints
    //1/2 < floor(mod(floor(y/17)*2^(-17*floor(x)-mod(floor(y),17)),2))
    //console.log(x,y);
    //console.log(y/17n*2n,(-17n*x-y%17n));
    //modexp(y/17n*2n,(-17n*x-y%17n),2n)*2n > 1n;
    //console.log(x,y);
    //console.log(((y/17n/(2n**(17n*x+y%17n)))%2n)*2n);
    
    
    //return xor(x%2n===0n, y%2n===0n);
    return (((y/17n)/(2n**(17n*x+y%17n)))%2n)*2n > 1n
    //y/17n*2n,(-17n*x-y%17n),2n > 1n;
};


let cw = new ELEM(document.querySelector("#wrapper"));

let xg,yg;

let main = function(){
    let control = new Control();
    let yin = control.addRow("textarea","label: y;").charmatch(/[0-9]/);
    let xin = control.addRow("number","label: x;").charmatch(/[0-9]/);
    let xin = control.addRow("number","label: x;");
    control.addRow("submit",()=>{
        yg = BigFloat(BigInt(yin.value));
    });
    Control("label: y; type: textarea;");
    let canvas = cw.add("canvas").e;
    let ctx = canvas.getContext("2d");
    
    
    let keys = {};
    
    let keymgr = new KeyManager(window,"keydown keyup");
    keymgr.add("w ArrowUp",(e)=>{
        keys.up = e.type === "keydown";
    });
    keymgr.add("a ArrowLeft",(e)=>{
        keys.left = e.type === "keydown";
    });
    keymgr.add("s ArrowDown",(e)=>{
        keys.down = e.type === "keydown";
    });
    keymgr.add("d ArrowRight",(e)=>{
        keys.right = e.type === "keydown";
    });
    
    let zoom = 5;//10 px = 1 unit
    xg = BigFloat(0);
    yg = BigFloat(0);//bottom left corner
    
    let colorCache = {};
    let getColor = function(x,y){
        y = height-y;
        x /= zoom;
        y /= zoom;
        let xx = add(xg,x).int;
        let yy = add(yg,y).int;//big int
        //console.log(xx,yy);
        let id = (xx%1000n)+","+(yy%1000n);
        if(id in colorCache)return colorCache[id];
        //console.log("cache miss");
        //return ineq(xx,yy)?255:0;
        colorCache[id] = ineq(xx,yy)?0:255;
        return colorCache[id];
    };
    
    
    let render = function(){
        console.log(add(xg,12.5));
        let imgdata = ctx.getImageData(0,0,width,height);
        let data = imgdata.data;
        colorCache = {};
        for(let y = 0; y < height; y++){
            for(let x = 0; x < width; x++){
                let idx = (y*width+x)*4;
                let col = getColor(x,y);
                data[idx+0] = col;
                data[idx+1] = col;
                data[idx+2] = col;
                data[idx+3] = 255;
            }
        }
        ctx.putImageData(imgdata,0,0);
    };
    
    
    Animation.onFrame((t,dt)=>{
        let renderFlag = false;
        if(canvas.width !== cw.e.offsetWidth || 
           canvas.height !== cw.e.offsetHeight){
           width = cw.e.offsetWidth;
           height = cw.e.offsetHeight;
           canvas.width = width;
           canvas.height = height;
           renderFlag = true;
        }
        let vv = 100/zoom*dt/1000;//100 pixel per second
        let dx = keys.right?vv:0 + keys.left?-vv:0;
        let dy = keys.up?vv:0 + keys.down?-vv:0;
        xg = add(xg,dx);
        yg = add(yg,dy);
        
        if(dx !== 0 || dy !== 0)renderFlag = true;
        
        
        //re-render
        if(renderFlag)render();
    });
}

main();