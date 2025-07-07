

import sys
import textwrap

def format_markdown_file(file_path):
    """
    Formats a markdown file to have a maximum line length of 72 characters.
    """
    if not file_path.endswith(('.md', '.markdown')):
        print(f"Not a markdown file: {file_path}", file=sys.stderr)
        return

    try:
        with open(file_path, 'r') as f:
            content = f.read()

        # Preserve original line breaks
        lines = content.split('\n')
        
        # Wrap each line individually
        wrapped_lines = []
        for line in lines:
            # If the line is empty, it's a paragraph break. Preserve it.
            if not line.strip():
                wrapped_lines.append('')
                continue

            # If the line is a header, blockquote, or list item, don't wrap it.
            if line.strip().startswith(('#', '>', '-', '*', '+')) or (len(line.strip()) > 0 and line.strip()[0].isdigit() and line.strip()[1] == '.'):
                wrapped_lines.append(line)
                continue

            # Wrap the text
            wrapper = textwrap.TextWrapper(width=72, break_long_words=False, replace_whitespace=False)
            wrapped_lines.extend(wrapper.wrap(line))

        formatted_content = "\n".join(wrapped_lines)

        with open(file_path, 'w') as f:
            f.write(formatted_content)

        print(f"Successfully formatted {file_path}")

    except FileNotFoundError:
        print(f"Error: File not found at {file_path}", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)

if __name__ == "__main__":
    print("Markdown Formatter Script")
    if len(sys.argv) != 2:
        print("Usage: python format_markdown.py <file_path>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    format_markdown_file(file_path)

