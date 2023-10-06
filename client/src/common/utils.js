function cloneArray(x) {
    //why bother with JSON.parse(JSON.stringify()) when we know we have an array
    //this deep copies an array that has 2 indices - no nesting
    return x.map(x=>x.map(x=>x));
}

function bsearch(A,x,debug=false) {

    let p0=0, p1=A.length-1, closest=-1
    let count = 0
    while (p0<=p1) {
        
        count ++
        //const mid2 = p0 + Math.trunc( (p1-p0)/2 )
        const mid =  Math.trunc( (p0+p1)/2 )
        //mid and mid2 are equivalent

        if (debug) console.log('middle',mid,A[mid])

        //we need to keep track if the string matches the beginning of the word
        //so we can decide whether to bail out of the path in the graphsearch
        //or else we have 10^5 of steps instead of dozens
        if ( x === A[mid].substring(0,x.length)) closest = mid;

        if ( x < A[mid]) {
            if ( x === A[p0] ) return [true,true, false, p0,A[p0],count,'p0']
            p1 = mid - 1
        }
        else if ( x > A[mid] ) {
            if ( x === A[p1] ) return [true,true, false, p1,A[p1],count,'p1']
            p0 = mid + 1
        }
        else {
            return [true,true, false, mid, A[mid], count, 'mid']
        }
    }

    if ( closest > -1 ) {
        return [true,false, true, closest, A[closest], 'closest' ]
    }
    return [ false, false , false, -1, 'no match', count, 'none']
}

export  { cloneArray, bsearch };