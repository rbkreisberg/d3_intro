var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZ';
    function generateNode() {
        var source = ['GEXP','METH','CNVR','MIRN','GNAB'][(Math.random()*5) >>> 0];
        var label = _.chain(_.range(0,4)).reduce(function(a,b) { return a+chars[Math.random()*chars.length >>> 0];},'').value();
        var in1 = Math.random()*(chrom_keys.length) >>> 0;
        //put in unmapped chromsomes sometimes
        var chr1 = chrom_keys[in1] + ['_random',''][+(Math.random() > 0.05)];
        var mut1 = Math.random()*6 >>> 0;
        var cnv1 = Math.random()*500 >>> 0;
        //make a good start number with our without a good chromsome
        var start1 = chrom_attr[chr1] ? Math.random() * (chrom_attr[chr1].length - 50000) >>> 0 : 20;
        return {label:'C:'+ source +':'+label+':'+chr1+':'+start1+':'+(start1+50000)+'::',chr:chr1,start:start1,end:start1
                + 50000,source:'+', mutation_count:mut1};
    }

function generateClinicalNode() {
    var node = generateNode();
    var source = ['CLIN','SAMP'][(Math.random()*2) >>> 0];
    var label_arr = node.label.split(':');
    label_arr[1] = source;
    label_arr[3] = label_arr[4] = label_arr[5] = "";
    node.label = label_arr.join(':');
    node.chr = node.start = node.end = node.source = node.mutation_count = "";
    return node;
}

function generateFeature() {
    var node1 = generateNode(),
    node2 = generateClinicalNode();
    node1.clin_alias = node2.label;
    return node1;
}

    function generateAssociation() {
        var val1 = (Math.random()*0.3).toFixed(4);
        var nodeType = [0,1].map(function() { return [generateClinicalNode,generateNode][+(Math.random() > 0.2)];});
        return {node1:nodeType[0](), node2:nodeType[1](), assoc_value1:val1};
    }

    vq.CircVis.prototype.addRFAssociation = function(array) {
        var edges = [],
        nodes =[];
        array = _.isArray(array) ? array : [array];
            _.each(array, function(assoc){
                if (_.isEmpty(assoc.node1.chr)) {
                    nodes.push(_.extend(assoc.node2,{clin_alias:assoc.node1.label}));
                    return;
                } else if (_.isEmpty(assoc.node2.chr)) {
                       nodes.push(_.extend(assoc.node1,{clin_alias:assoc.node2.label}));
                       return;
                }
                else {
                    edges.push(assoc);
                }        
            });
            this.addEdges(edges);
            this.addNodes(nodes);
    }
