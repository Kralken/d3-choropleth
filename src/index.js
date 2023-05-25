import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Legend } from './color-legend';
import './styles.css';

//first link is the map topographical data, second link is the education levels per county
let urls = [
  'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json',
  'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json',
];
let height = 800;
let width = 1200;
let padding = { left: 50, top: 100, bottom: 100, right: 25 };

let chart = d3
  .select('#chart-area')
  .append('svg')
  .attr('id', 'chart')
  .attr('height', height)
  .attr('width', width);

Promise.all(urls.map((link) => fetch(link)))
  .then((responses) => Promise.all(responses.map((response) => response.json())))
  .then((data) => {
    let geoJson = topojson.feature(data[0], data[0].objects.counties);
    let educationLevels = data[1];

    let colorScale = d3
      .scaleQuantize()
      .domain(d3.extent(educationLevels, (d) => d.bachelorsOrHigher))
      .range(d3.schemeBlues[9].slice(2));

    //legend
    chart
      .append('g')
      .attr('id', 'legend')
      .append(() => {
        return Legend(colorScale, {
          title: "% of adults with Bachelor's degree",
          tickFormat: (d) => d.toFixed(0) + '%',
        });
      })
      .style(
        'transform',
        `translate(${width / 2 - d3.select('#legend').node().getClientRects()[0].width / 2}px, ${
          height - padding.bottom + 50
        }px)`,
      );

    //title and description
    let titleAndDescription = chart
      .append('g')
      .style('transform', `translate(${width / 2}px, ${padding.top - 50}px)`)
      .style('text-anchor', 'middle');
    //title
    titleAndDescription
      .append('text')
      .attr('id', 'title')
      .text('US Educational Attainment')
      .style('font-size', '3em');

    //description
    titleAndDescription
      .append('text')
      .attr('id', 'description')
      .text("Percentages of Adults age 25 and up with a bachelor's degree or higher")
      .style('font-size', '1.3em')
      .style('transform', 'translateY(+30px)');

    //map draw
    chart
      .append('g')
      .attr('id', 'map-chart')
      .selectAll('path')
      .data(geoJson.features)
      .enter()
      .append('path')
      .attr('stroke', 'none')
      .attr('d', d3.geoPath())
      .attr('class', 'county')
      .attr('data-fips', (d) => d.id)
      .attr('data-education', (d) => {
        let county = educationLevels.find((elem) => elem.fips == d.id);
        return county.bachelorsOrHigher;
      })
      .style('fill', (d) => {
        let county = educationLevels.find((elem) => elem.fips == d.id);
        return colorScale(county.bachelorsOrHigher);
      })
      .on('mouseenter', function (e) {
        d3.select(this).style('stroke', 'black');
        d3.select('body')
          .append('div')
          .attr('id', 'tooltip')
          .style('left', e.pageX + 'px')
          .style('top', e.pageY + 'px')
          .style('transform', 'translate(-50%, -100%) translateY(-15px)')
          .attr(
            'data-education',
            () =>
              educationLevels.find((elem) => elem.fips == d3.select(this).attr('data-fips'))
                .bachelorsOrHigher,
          )
          .text(() => {
            let county = educationLevels.find(
              (elem) => elem.fips == d3.select(this).attr('data-fips'),
            );
            return `${county.area_name}, ${county.state}: ${county.bachelorsOrHigher}%`;
          });
      })
      .on('mousemove', function (e) {
        d3.select('#tooltip')
          .style('top', e.pageY + 'px')
          .style('left', e.pageX + 'px');
      })
      .on('mouseleave', function () {
        d3.select(this).style('stroke', 'none');
        d3.select('#tooltip').remove();
      });

    //center map in the box
    d3.select('#map-chart').style(
      'transform',
      `translate(${
        padding.left + (width - d3.select('#map-chart').node().getClientRects()[0].width) / 2 //center the map based on its current width
      }px, ${padding.top}px)`,
    );
  });
