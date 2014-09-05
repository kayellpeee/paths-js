(function() {
  define(['./rectangle', './curved-rectangle', './ops'], function(Rectangle, CurvedRectangle, O) {
    return function(_arg) {
      var compute, curved_rects, data, gutter, height, height_of_groups, link_accessor, links_, name, name_values, node_accessor, node_idx, nodes_, rect_width, rects, scale, space_for_each_group, spacing_groups, val, vals_in, vals_out, width;
      data = _arg.data, node_accessor = _arg.node_accessor, link_accessor = _arg.link_accessor, width = _arg.width, height = _arg.height, gutter = _arg.gutter, rect_width = _arg.rect_width, compute = _arg.compute;
      if (node_accessor == null) {
        node_accessor = function(x) {
          return x;
        };
      }
      if (link_accessor == null) {
        link_accessor = function(x) {
          return x;
        };
      }
      if (gutter == null) {
        gutter = 10;
      }
      if (rect_width == null) {
        rect_width = 10;
      }
      links_ = data.links.map(link_accessor);
      nodes_ = data.nodes.map(function(level) {
        return level.map(node_accessor);
      });
      spacing_groups = (width - rect_width) / (data.nodes.length - 1);
      name_values = {};
      data.nodes.reduce(function(a, b) {
        return a.concat(b);
      }).forEach(function(name) {
        return name_values[name] = {
          value: 0,
          currently_used_in: 0,
          currently_used_out: 0
        };
      });
      for (name in name_values) {
        vals_in = links_.filter(function(x) {
          return x.end === name;
        }).map(function(x) {
          return x["weight"];
        }).reduce((function(x, y) {
          return x + y;
        }), 0);
        vals_out = links_.filter(function(x) {
          return x.start === name;
        }).map(function(x) {
          return x["weight"];
        }).reduce((function(x, y) {
          return x + y;
        }), 0);
        name_values[name]["value"] = Math.max(vals_in, vals_out);
      }
      height_of_groups = data.nodes.map(function(group) {
        return group.map(function(name) {
          return name_values[name]["value"];
        }).reduce(function(x, y) {
          return x + y;
        });
      });
      space_for_each_group = data.nodes.map(function(group) {
        return height - (group.length - 1) * gutter;
      });
      scale = height_of_groups.map(function(height_of_group, idx) {
        return space_for_each_group[idx] / height_of_group;
      }).reduce(function(x, y) {
        return Math.min(x, y);
      });
      for (name in name_values) {
        val = name_values[name];
        name_values[name]["scaled_value"] = scale * val["value"];
      }
      rects = [];
      node_idx = -1;
      data.nodes.forEach(function(group, idg) {
        var first_top, h_group, previous_bottom, vertical_spacing;
        h_group = group.reduce((function(x, y) {
          return x + name_values[y]["scaled_value"];
        }), 0) + (group.length - 1) * gutter;
        vertical_spacing = (height - h_group) / 2;
        first_top = vertical_spacing;
        previous_bottom = first_top - gutter;
        return group.forEach(function(name, idn) {
          var att, bottom, top;
          top = previous_bottom + gutter;
          bottom = top + name_values[name]["scaled_value"];
          previous_bottom = bottom;
          att = name_values[name]["rectangle_coords"] = {
            top: top,
            bottom: bottom,
            left: rect_width / 2 + idg * spacing_groups - rect_width / 2,
            right: rect_width / 2 + idg * spacing_groups + rect_width / 2
          };
          node_idx += 1;
          return rects.push(O.enhance(compute, {
            curve: Rectangle(att),
            item: data.nodes[idg][idn],
            index: node_idx
          }));
        });
      });
      curved_rects = links_.map(function(link, i) {
        var a, b, curved_rect, rect_source, rect_target, scaled_weight, source, target;
        source = link["start"];
        target = link["end"];
        rect_source = name_values[source]["rectangle_coords"];
        rect_target = name_values[target]["rectangle_coords"];
        scaled_weight = link["weight"] * scale;
        a = rect_source["top"] + name_values[source]["currently_used_out"];
        b = rect_target["top"] + name_values[target]["currently_used_in"];
        curved_rect = {
          topleft: [rect_source["right"], a],
          topright: [rect_target["left"], b],
          bottomleft: [rect_source["right"], a + scaled_weight],
          bottomright: [rect_target["left"], b + scaled_weight]
        };
        name_values[source]["currently_used_out"] = name_values[source]["currently_used_out"] + scaled_weight;
        name_values[target]["currently_used_in"] = name_values[target]["currently_used_in"] + scaled_weight;
        return O.enhance(compute, {
          curve: CurvedRectangle(curved_rect),
          item: data.links[i],
          index: i
        });
      });
      return {
        curvedRectangles: curved_rects,
        rectangles: rects
      };
    };
  });

}).call(this);
