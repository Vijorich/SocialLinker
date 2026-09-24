require 'liquid'

patterns = [
  'index.html', '404.html', 'DESIGN.md', 'CONTEXT.md',
  '_posts/*.md', 'docs/**/*.md', '_includes/*.html', '_layouts/*.html', '*.xml', 'robots.txt'
]
files = patterns.flat_map { |p| Dir.glob(p) }.uniq.sort

failed = []
files.each do |f|
  begin
    Liquid::Template.parse(File.read(f), line_numbers: true)
  rescue Liquid::SyntaxError => e
    line = e.respond_to?(:line_number) && e.line_number ? e.line_number : '?'
    failed << "#{f}:#{line} #{e.message}"
  end
end

if failed.empty?
  puts "#{files.size} files checked, all parse clean"
else
  failed.each { |m| puts "FAIL #{m}" }
  abort "#{files.size} files checked, #{failed.size} with Liquid syntax errors"
end
