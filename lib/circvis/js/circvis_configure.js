(function() {

    var width=700,
        height=700,
        cnv_ring_height = 20,
        color_scale =    { 'GEXP': '#1f77b4',
            //blue
            'METH': '#2ca02c',
            //green
            'CNVR': '#ff7f0e',
            //orange
            'MIRN': '#9467bd',
            //purple
            'GNAB': '#d62728',
            //red
            'PRDM': '#8c564b',
            //pink
            'RPPA': '#e377c2',
            //brown
            'CLIN': '#aa4444',
            'SAMP': '#bcbd22',
            'other' : '#17becf'
        };

        function feature_type(feature) { return feature && feature.label && !!~feature.label.indexOf(':') ? 
                    feature.label.split(':')[1] : 'other';}
        function clin_type(feature) { return feature && feature.clin_alias && !!~feature.clin_alias.indexOf(':')?
        feature.clin_alias.split(':')[1] : 'other';}
        
        var shape_map ={'CLIN':'square','SAMP':'cross','other':'diamond'};
        function shape(type) { return shape_map[type];}
        function clinical_shape(feature) { return shape(clin_type(feature));}

    var tick_colors = function(data) {       
        return type_color(feature_type(data));
    };

    var type_color = function(type) {
        return color_scale[type] || color_scale['other'];
    };

    var label_map = {'METH' : 'DNA Methylation',
        'CNVR': 'Copy Number Variation Region',
        'MIRN' :'mircoRNA',
        'GNAB' : 'Gene Abberation',
        'GEXP': 'Gene Expression',
        'CLIN': 'Clinical Data',
        'SAMP': 'Tumor Sample'
    };

    var hovercard_items_config = {Feature:function(feature) { var label = feature.label.split(':'); return label[2] + 
    ' (<span style="color:'+type_color(feature_type(feature))+'">' +
        label_map[feature_type(feature)] + '</span>)';},
        Location: function(feature) { return 'Chr ' + feature.chr + ' ' + feature.start + (feature.end ? '-' + feature.end : '');},
        'Somatic Mutations': 'mutation_count'};

    var clinical_hovercard_items_config  = _.extend({},hovercard_items_config);

     _.extend(clinical_hovercard_items_config,
        {
            'Clinical Coorelate' : function(feature) { var label = feature.clin_alias.split(':'); 
                    return label[2] + ' (<span style="color:'+type_color(clin_type(feature)) +'">' + label_map[clin_type(feature)] + '</span>)';}
    }
        );

    var links = [
        {
            label: 'UCSC Genome Browser',
            key: 'ucsc',
            url: 'http://genome.ucsc.edu/cgi-bin/hgTracks',
            uri: '?db=hg18&position=chr',
            href: function(feature) {
                return 'http://genome.ucsc.edu/cgi-bin/hgTracks?db=hg18&position=chr' + feature.chr + ':' + feature.start + (feature.end == '' ? '' : '-' + feature.end);
            }
        }, //ucsc_genome_browser
        {
            label: 'Ensembl',
            key: 'ensembl',
            url: 'http://uswest.ensembl.org/Homo_sapiens/Location/View',
            uri: '?r=',
            href: function(feature) {
                return 'http://uswest.ensembl.org/Homo_sapiens/Location/View?r=' + feature.chr + ':' + feature.start + (feature.end == '' ? '' : '-' + feature.end);
            }
        }, //ensemble
        {
            label: 'Cosmic',
            key: 'cosmic',
            url: 'http://www.sanger.ac.uk/perl/genetics/CGP/cosmic',
            uri: '?action=bygene&ln=',
            href: function(feature) {
                return _.include(['CNVR', 'MIRN','METH'],feature.source) ? 'http://www.sanger.ac.uk/perl/genetics/CGP/cosmic?action=bygene&ln=' + feature.label.split(':')[2] : null;
            }
        },
        {
            label: 'miRBase',
            key: 'mirbase',
            url: 'http://mirbase.org/cgi-bin/query.pl',
            uri: '?terms=',
            href: function(feature) {
                return feature.source == 'MIRN' ? 'http://www.mirbase.org/cgi-bin/query.pl?terms=' + feature.label.split(':')[2] : null;
            }
        }
    ];

    var hovercard_links_config = {};

    _.each(links, function(item){hovercard_links_config[item.label]=item;});
    var data = function(div) { return {
        PLOT: {
            container: div,
            width : width,
            height: height,
            vertical_padding : 10,
            horizontal_padding: 10,
            enable_pan : false,
            enable_zoom : false,
            show_legend: true,
            legend_corner : 'ne',
            legend_radius  : 45
        },

        GENOME: {
            DATA:{
                key_order : chrom_keys,
                key_length :_.map(chrom_keys, function(key) {return {chr_name:key, chr_length:chrom_attr[key].length};})
            },
            OPTIONS: {
                radial_grid_line_width : 2,
                label_layout_style:'clock',
                label_font_style:'16px helvetica',
                gap_degrees : 2
            }
        },

        WEDGE:[
            {
                PLOT : {
                    height : 25,
                    type : 'karyotype'
                } ,
                DATA:{
                    data_array : cytoband
                },
                OPTIONS: {

                    legend_label : 'Cytogenic Bands',
                    legend_description : 'Cytogenic Bands',
                    listener : function() {return null;},
                    outer_padding: 4,
                    stroke_style:'rgba(200,200,200,0.5)',
                    line_width:'0.5px',
                    tooltip_items:{'Cytogenic Band':'label',
                        "Location": function(feature) { return 'Chr ' + feature.chr + ' ' + feature.start + (feature.end ? '-' + feature.end : '');}
                    }
                }
            },
            {   PLOT : {
                height : 15,
                type : 'glyph'
            } ,
                DATA:{
                    data_array : [],//cnv
                    value_key:'clin_alias',
                    hash:function(point) { return point.label + '_' + point.clin_alias;}
                },
                OPTIONS: {
                    tile_height:10,
                    tile_padding:6,
                    tile_overlap_distance:10000000,
                    tile_show_all_tiles : true,
                    fill_style:function(feature) { return type_color(clin_type(feature));},
                    stroke_style:null,
                    line_width:3,
                    legend_label : 'Clinical Associations',
                    shape:clinical_shape,
                    radius:7,
                    legend_description : 'Clinical Associations',
                    listener : function() {return null;},
                    outer_padding: 2,
                    tooltip_items: clinical_hovercard_items_config,
                    tooltip_links: hovercard_links_config
                }
            },
            {
                PLOT : {

                    height : 20,
                    type : 'histogram'
                },
                DATA:{
                    data_array : [],//link_density,
                    value_key : 'mutation_count'
                },
                OPTIONS: {
                    legend_label : 'Mutation Count',
                    legend_description : 'Mutation Count',
                    min_value : 0,
                    max_value : 6,
                    base_value : 0,
                    radius : 4,
                    outer_padding: 10,
                    stroke_style : 'orange',
                    line_width:6,
                    tooltip_items: hovercard_items_config,
                    tooltip_links: hovercard_links_config,
                    fill_style: 'orange',
                    listener : function() {return null;}
                }
            }
        ],

        TICKS : {
            DATA: {
                data_array:[]
            },
            OPTIONS : {
                wedge_height: 8,
                wedge_width:0.7,
                overlap_distance:10000000, //tile ticks at specified base pair distance
                height : 50,
                display_legend : true,
                legend_corner : 'nw',
                fill_style : tick_colors,
                tooltip_items: hovercard_items_config,
                tooltip_links: hovercard_links_config
            }
        },

        NETWORK:{
            DATA:{
                data_array : []//
            },
            OPTIONS: {
                outer_padding : 5,
                tile_nodes : Boolean(true),
                node_overlap_distance: 3e8,
                node_radius:2,
                node_fill_style : tick_colors,
                link_stroke_style : 'red',
                link_line_width:2,
                link_alpha : 0.6,
                node_highlight_mode : 'isolate',
                node_key : function(node) { return node.label;},
                node_tooltip_items :  hovercard_items_config,
                node_tooltip_links: hovercard_links_config,
                link_tooltip_items :  {
                    'Target' : function(link) { var label = link.source.label.split(':'); return '<span style="color:'+tick_colors(link.source)+'">' +
                        label_map[label[1]] + '</span> ' + label[2];},
                    'Target Location' : function(link) { return 'Chr ' + link.source.chr + ' ' + link.source.start +
                        (link.source.end ? '-' + link.source.end : '');},
                    'Predictor' : function(link) { var label = link.target.label.split(':'); return '<span style="color:'+tick_colors(link.target)+'">' +
                        label_map[label[1]] + '</span> ' + label[2];},
                    'Predictor Location' : function(link) { return 'Chr ' + link.target.chr + ' ' + link.target.start +
                        (link.target.end ? '-' + link.target.end : '');},
                    Importance:'assoc_value1'
                }
            }
        }
    };
    };

    circvis = {};
    circvis.plot = function(div) {
        var circle_vis = new vq.CircVis();
        var contents = data(div);
        var dataObject ={DATATYPE : "vq.models.CircVisData", CONTENTS : contents };
        circle_vis.draw(dataObject);
        return circle_vis;
    }

    $('#50_random_edge').on('click',function() {
                var edges = _(_.range(0,10)).map(generateAssociation);
                circle.addRFAssociation(edges);
            }
    );
  
  

})();